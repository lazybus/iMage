import { Buffer } from "node:buffer";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { BatchImageRecord, BatchStatus, ImageResultRecord, ProcessingRunRecord } from "@/lib/db/types";
import { NanoBananaProvider } from "@/lib/providers/nano-banana";
import { buildProcessedPath } from "@/lib/storage/paths";
import { getStorageBucketName } from "@/lib/supabase/config";

const STALE_QUEUED_RUN_MS = 2 * 60 * 1000;
const STALE_PROCESSING_RUN_MS = 15 * 60 * 1000;

interface WorkerImageResultRecord extends ImageResultRecord {
  batch_images: BatchImageRecord | null;
}

function normalizeProcessingError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown processing error.";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("credentials are not configured")) {
    return "Image editing credentials are not configured.";
  }

  if (normalizedMessage.includes("unable to download") || normalizedMessage.includes("download")) {
    return "The original image could not be loaded from storage.";
  }

  if (normalizedMessage.includes("returned no image data")) {
    return "The image editing service finished without returning an image.";
  }

  if (normalizedMessage.includes("rejected the request")) {
    return message;
  }

  if (normalizedMessage.includes("upload")) {
    return "The generated image could not be saved to storage.";
  }

  return message;
}

function deriveBatchStatus(imageStatuses: BatchStatus[]) {
  if (imageStatuses.length === 0) {
    return "ready" satisfies BatchStatus;
  }

  if (imageStatuses.some((status) => status === "queued")) {
    return "queued" satisfies BatchStatus;
  }

  if (imageStatuses.some((status) => status === "processing")) {
    return "processing" satisfies BatchStatus;
  }

  if (imageStatuses.some((status) => status === "failed")) {
    return "failed" satisfies BatchStatus;
  }

  if (imageStatuses.every((status) => status === "completed")) {
    return "completed" satisfies BatchStatus;
  }

  return "ready" satisfies BatchStatus;
}

async function updateBatchStatus(supabase: SupabaseClient, batchId: string, userId: string) {
  const { data: images, error } = await supabase.from("batch_images").select("status").eq("batch_id", batchId).eq("user_id", userId);

  if (error) {
    throw error;
  }

  const nextBatchStatus = deriveBatchStatus((images ?? []).map((image: { status: BatchStatus }) => image.status));
  const { error: batchUpdateError } = await supabase.from("batches").update({ status: nextBatchStatus }).eq("id", batchId).eq("user_id", userId);

  if (batchUpdateError) {
    throw batchUpdateError;
  }
}

async function markRunAsFailed(supabase: SupabaseClient, run: ProcessingRunRecord, errorMessage: string) {
  const { data: runResults, error: resultError } = await supabase
    .from("image_results")
    .select("id, image_id, status")
    .eq("run_id", run.id)
    .eq("user_id", run.user_id);

  if (resultError) {
    throw resultError;
  }

  const pendingResults = (runResults ?? []).filter((result: { status: BatchStatus }) => result.status === "queued" || result.status === "processing");
  const pendingImageIds = [...new Set(pendingResults.map((result: { image_id: string }) => result.image_id))];
  const now = new Date().toISOString();

  if (pendingResults.length > 0) {
    const { error: updateResultError } = await supabase
      .from("image_results")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("run_id", run.id)
      .eq("user_id", run.user_id)
      .in(
        "status",
        ["queued", "processing"],
      );

    if (updateResultError) {
      throw updateResultError;
    }
  }

  if (pendingImageIds.length > 0) {
    const { error: imageUpdateError } = await supabase
      .from("batch_images")
      .update({ status: "failed" })
      .eq("batch_id", run.batch_id)
      .eq("user_id", run.user_id)
      .in("id", pendingImageIds);

    if (imageUpdateError) {
      throw imageUpdateError;
    }
  }

  const { error: runUpdateError } = await supabase
    .from("processing_runs")
    .update({
      status: "failed",
      completed_at: now,
      error_message: errorMessage,
    })
    .eq("id", run.id)
    .eq("user_id", run.user_id);

  if (runUpdateError) {
    throw runUpdateError;
  }

  await updateBatchStatus(supabase, run.batch_id, run.user_id);
}

function isStaleRun(run: ProcessingRunRecord) {
  const now = Date.now();

  if (run.status === "queued") {
    return now - new Date(run.created_at).getTime() > STALE_QUEUED_RUN_MS;
  }

  if (run.status === "processing") {
    const referenceTime = run.started_at ?? run.created_at;
    return now - new Date(referenceTime).getTime() > STALE_PROCESSING_RUN_MS;
  }

  return false;
}

export async function recoverStaleRunsForUser(supabase: SupabaseClient, userId: string) {
  const { data: runs, error } = await supabase
    .from("processing_runs")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  let recoveredCount = 0;

  for (const run of (runs ?? []) as ProcessingRunRecord[]) {
    if (!isStaleRun(run)) {
      continue;
    }

    recoveredCount += 1;
    await markRunAsFailed(supabase, run, "Recovered from interrupted processing. Retry to continue.");
  }

  return recoveredCount;
}

async function processImageResult(supabase: SupabaseClient, result: WorkerImageResultRecord, run: ProcessingRunRecord) {
  const image = result.batch_images;
  if (!image) {
    throw new Error(`Missing batch image row for result ${result.id}.`);
  }

  const storageBucket = getStorageBucketName();
  const provider = new NanoBananaProvider();

  const { error: markProcessingError } = await supabase.from("image_results").update({ status: "processing" }).eq("id", result.id).eq("user_id", result.user_id);
  if (markProcessingError) {
    throw markProcessingError;
  }

  const { error: imageProcessingStatusError } = await supabase.from("batch_images").update({ status: "processing" }).eq("id", image.id).eq("user_id", result.user_id);
  if (imageProcessingStatusError) {
    throw imageProcessingStatusError;
  }

  const { data: originalBlob, error: originalDownloadError } = await supabase.storage.from(storageBucket).download(image.input_storage_path);
  if (originalDownloadError || !originalBlob) {
    throw new Error(originalDownloadError?.message ?? `Unable to download ${image.input_storage_path} from storage.`);
  }

  const imageBase64 = Buffer.from(await originalBlob.arrayBuffer()).toString("base64");
  const providerResponse = await provider.editImage({
    prompt: image.edit_prompt,
    imageBase64,
    imageMimeType: originalBlob.type || "image/png",
  });

  const outputFilename = providerResponse.image.mimeType === "image/jpeg" ? `${image.original_filename}.jpg` : image.original_filename;
  const outputPath = buildProcessedPath(result.user_id, run.batch_id, image.id, outputFilename);
  const outputBuffer = Buffer.from(providerResponse.image.imageBytes, "base64");

  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(outputPath, outputBuffer, {
    contentType: providerResponse.image.mimeType,
    upsert: true,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: resultUpdateError } = await supabase
    .from("image_results")
    .update({
      provider_job_id: providerResponse.providerJobId,
      output_storage_path: outputPath,
      status: "completed",
      provider_payload: providerResponse.rawPayload,
      error_message: null,
    })
    .eq("id", result.id)
    .eq("user_id", result.user_id);

  if (resultUpdateError) {
    throw resultUpdateError;
  }

  const { error: imageCompleteStatusError } = await supabase.from("batch_images").update({ status: "completed" }).eq("id", image.id).eq("user_id", result.user_id);
  if (imageCompleteStatusError) {
    throw imageCompleteStatusError;
  }
}

async function markFailed(supabase: SupabaseClient, result: WorkerImageResultRecord, errorMessage: string) {
  const image = result.batch_images;

  await supabase
    .from("image_results")
    .update({
      status: "failed",
      error_message: errorMessage,
    })
    .eq("id", result.id)
    .eq("user_id", result.user_id);

  if (image) {
    await supabase.from("batch_images").update({ status: "failed" }).eq("id", image.id).eq("user_id", result.user_id);
  }
}

export async function processRunNow(supabase: SupabaseClient, runId: string, userId: string) {
  const { data: run, error: runError } = await supabase
    .from("processing_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .single();

  if (runError || !run) {
    throw runError ?? new Error("Processing run not found.");
  }

  const { error: runStartError } = await supabase
    .from("processing_runs")
    .update({ status: "processing", started_at: new Date().toISOString(), error_message: null })
    .eq("id", runId)
    .eq("user_id", userId);

  if (runStartError) {
    throw runStartError;
  }

  const { data: results, error: resultsError } = await supabase
    .from("image_results")
    .select("*, batch_images(*)")
    .eq("run_id", runId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (resultsError) {
    throw resultsError;
  }

  let failedCount = 0;

  for (const result of (results ?? []) as WorkerImageResultRecord[]) {
    try {
      await processImageResult(supabase, result, run as ProcessingRunRecord);
    } catch (error) {
      failedCount += 1;
      await markFailed(supabase, result, normalizeProcessingError(error));
    }
  }

  const finalStatus: BatchStatus = failedCount > 0 ? "failed" : "completed";
  const { error: runCompleteError } = await supabase
    .from("processing_runs")
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      error_message: failedCount > 0 ? `${failedCount} image edit${failedCount === 1 ? "" : "s"} failed.` : null,
    })
    .eq("id", runId)
    .eq("user_id", userId);

  if (runCompleteError) {
    throw runCompleteError;
  }

  await updateBatchStatus(supabase, (run as ProcessingRunRecord).batch_id, userId);

  return {
    runId,
    status: finalStatus,
    failedCount,
    processedCount: (results ?? []).length,
  };
}

export async function processQueuedImageResults() {
  const provider = new NanoBananaProvider();

  return {
    provider,
    note: "Use processRunNow to execute queued image results synchronously from the current run endpoints.",
  };
}
