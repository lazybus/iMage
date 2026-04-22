import { after, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import { enqueueBatchRun, enqueueSingleImageRun } from "@/lib/jobs/enqueue";
import { processRunNow } from "@/lib/jobs/worker";

export async function POST(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth;

  const { data: run, error: runError } = await supabase
    .from("processing_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "Processing run not found." }, { status: 404 });
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", run.batch_id)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  if (run.run_scope === "single") {
    const { data: image, error: imageError } = await supabase
      .from("batch_images")
      .select("*")
      .eq("id", run.target_image_id)
      .eq("user_id", user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const nextRun = await enqueueSingleImageRun(supabase, batch, image, user, run.upscale_requested);

    after(async () => {
      await processRunNow(supabase, nextRun.id, user.id);
    });

    return NextResponse.json({ runId: nextRun.id, status: nextRun.status, runScope: nextRun.run_scope }, { status: 202 });
  }

  const { data: priorResults, error: priorResultsError } = await supabase
    .from("image_results")
    .select("image_id, status")
    .eq("run_id", run.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (priorResultsError) {
    return NextResponse.json({ error: priorResultsError.message }, { status: 500 });
  }

  const retryImageIds = [
    ...new Set(
      (priorResults ?? [])
        .filter((result: { status: string }) => result.status === "failed" || result.status === "queued" || result.status === "processing")
        .map((result: { image_id: string }) => result.image_id),
    ),
  ];

  const { data: images, error: imageError } = await supabase
    .from("batch_images")
    .select("*")
    .eq("batch_id", batch.id)
    .eq("user_id", user.id)
    .in("id", retryImageIds.length > 0 ? retryImageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("sort_order", { ascending: true });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const nextImages = retryImageIds.length > 0 ? images ?? [] : [];

  if (nextImages.length === 0) {
    return NextResponse.json({ error: "No failed images are available to retry for this run." }, { status: 400 });
  }

  const nextRun = await enqueueBatchRun(supabase, batch, nextImages, user, run.upscale_requested);

  after(async () => {
    await processRunNow(supabase, nextRun.id, user.id);
  });

  return NextResponse.json({ runId: nextRun.id, status: nextRun.status, runScope: nextRun.run_scope }, { status: 202 });
}