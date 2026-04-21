import { after } from "next/server";
import { NextResponse } from "next/server";

import { enqueueBatchRun } from "@/lib/jobs/enqueue";
import { processRunNow } from "@/lib/jobs/worker";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { batchId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { upscaleRequested?: boolean };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { data: images, error: imageError } = await supabase
    .from("batch_images")
    .select("*")
    .eq("batch_id", batchId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const run = await enqueueBatchRun(supabase, batch, images ?? [], user, Boolean(payload.upscaleRequested));

  after(async () => {
    await processRunNow(supabase, run.id, user.id);
  });

  return NextResponse.json(
    {
      runId: run.id,
      status: run.status,
      runScope: run.run_scope,
    },
    { status: 202 },
  );
}
