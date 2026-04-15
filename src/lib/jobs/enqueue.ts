import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { BatchImageRecord, BatchRecord, ProcessingRunRecord } from "@/lib/db/types";

async function createRun(
  supabase: SupabaseClient,
  batch: BatchRecord,
  user: User,
  scope: "single" | "batch",
  targetImageId: string | null,
  upscaleRequested: boolean,
) {
  const { data, error } = await supabase
    .from("processing_runs")
    .insert({
      batch_id: batch.id,
      user_id: user.id,
      run_scope: scope,
      target_image_id: targetImageId,
      status: "queued",
      upscale_requested: upscaleRequested,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ProcessingRunRecord;
}

export async function enqueueBatchRun(
  supabase: SupabaseClient,
  batch: BatchRecord,
  images: BatchImageRecord[],
  user: User,
  upscaleRequested: boolean,
) {
  const run = await createRun(supabase, batch, user, "batch", null, upscaleRequested);

  if (images.length === 0) {
    return run;
  }

  const { error: imageStatusError } = await supabase
    .from("batch_images")
    .update({ status: "queued" })
    .in(
      "id",
      images.map((image) => image.id),
    )
    .eq("user_id", user.id);

  if (imageStatusError) {
    throw imageStatusError;
  }

  const { error: resultError } = await supabase.from("image_results").insert(
    images.map((image) => ({
      image_id: image.id,
      run_id: run.id,
      user_id: user.id,
      status: "queued",
      provider_payload: {
        source_path: image.input_storage_path,
        prompt: image.edit_prompt,
        requested_upscale: upscaleRequested,
      },
    })),
  );

  if (resultError) {
    throw resultError;
  }

  await supabase.from("batches").update({ status: "queued" }).eq("id", batch.id).eq("user_id", user.id);

  return run;
}

export async function enqueueSingleImageRun(
  supabase: SupabaseClient,
  batch: BatchRecord,
  image: BatchImageRecord,
  user: User,
  upscaleRequested: boolean,
) {
  const run = await createRun(supabase, batch, user, "single", image.id, upscaleRequested);

  const { error: imageStatusError } = await supabase
    .from("batch_images")
    .update({ status: "queued" })
    .eq("id", image.id)
    .eq("user_id", user.id);

  if (imageStatusError) {
    throw imageStatusError;
  }

  const { error: resultError } = await supabase.from("image_results").insert({
    image_id: image.id,
    run_id: run.id,
    user_id: user.id,
    status: "queued",
    provider_payload: {
      source_path: image.input_storage_path,
      prompt: image.edit_prompt,
      requested_upscale: upscaleRequested,
    },
  });

  if (resultError) {
    throw resultError;
  }

  await supabase.from("batches").update({ status: "queued" }).eq("id", batch.id).eq("user_id", user.id);

  return run;
}
