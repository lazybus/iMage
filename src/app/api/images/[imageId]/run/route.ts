import { after } from "next/server";
import { NextResponse } from "next/server";

import { enqueueSingleImageRun } from "@/lib/jobs/enqueue";
import { processRunNow } from "@/lib/jobs/worker";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { imageId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { batchId?: string; upscaleRequested?: boolean };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: image, error: imageError } = await supabase
    .from("batch_images")
    .select("*")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single();

  if (imageError || !image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", payload.batchId ?? image.batch_id)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const run = await enqueueSingleImageRun(supabase, batch, image, user, Boolean(payload.upscaleRequested));

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
