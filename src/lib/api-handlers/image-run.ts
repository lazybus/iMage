import { after, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import { enqueueSingleImageRun } from "@/lib/jobs/enqueue";
import { processRunNow } from "@/lib/jobs/worker";

type ScheduleAfter = typeof after;

type ImageRunHandlerDependencies = {
  requireApiUser: typeof requireApiUser;
  enqueueSingleImageRun: typeof enqueueSingleImageRun;
  processRunNow: typeof processRunNow;
  scheduleAfter: ScheduleAfter;
};

export function createImageRunHandler(
  dependencies: ImageRunHandlerDependencies = { requireApiUser, enqueueSingleImageRun, processRunNow, scheduleAfter: after },
) {
  return async function POST(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = await params;
    const payload = (await request.json().catch(() => ({}))) as { batchId?: string; upscaleRequested?: boolean };
    const auth = await dependencies.requireApiUser();
    if ("response" in auth) {
      return auth.response;
    }

    const { supabase, user } = auth;

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

    const run = await dependencies.enqueueSingleImageRun(supabase, batch, image, user, Boolean(payload.upscaleRequested));

    dependencies.scheduleAfter(async () => {
      await dependencies.processRunNow(supabase, run.id, user.id);
    });

    return NextResponse.json(
      {
        runId: run.id,
        status: run.status,
        runScope: run.run_scope,
      },
      { status: 202 },
    );
  };
}