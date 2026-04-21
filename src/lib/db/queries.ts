import type { SupabaseClient, User } from "@supabase/supabase-js";

import type {
  BatchImageRecord,
  BatchRecord,
  BatchWithImages,
  ImageResultRecord,
  ProcessingRunRecord,
  QueueRunProgress,
  QueueRunSummary,
  QueueSummary,
} from "@/lib/db/types";

export async function listUserBatches(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as BatchRecord[];
}

export async function getBatchDetail(supabase: SupabaseClient, userId: string, batchId: string) {
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .eq("user_id", userId)
    .single();

  if (batchError) {
    return null;
  }

  const { data: images, error: imagesError } = await supabase
    .from("batch_images")
    .select("*")
    .eq("batch_id", batchId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    throw imagesError;
  }

  const imageIds = (images ?? []).map((image: BatchImageRecord) => image.id);
  let results: ImageResultRecord[] = [];

  if (imageIds.length > 0) {
    const { data: resultData, error: resultError } = await supabase
      .from("image_results")
      .select("*")
      .in("image_id", imageIds)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (resultError) {
      throw resultError;
    }

    results = (resultData ?? []) as ImageResultRecord[];
  }

  const resultMap = new Map<string, ImageResultRecord[]>();
  results.forEach((result) => {
    const existing = resultMap.get(result.image_id) ?? [];
    existing.push(result);
    resultMap.set(result.image_id, existing);
  });

  return {
    ...(batch as BatchRecord),
    images: (images ?? []).map((image: BatchImageRecord) => ({
      ...image,
      results: resultMap.get(image.id) ?? [],
    })),
  } as BatchWithImages;
}

export async function createBatchRecord(supabase: SupabaseClient, user: User, title: string) {
  const { data, error } = await supabase
    .from("batches")
    .insert({
      user_id: user.id,
      title,
      status: "ready",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BatchRecord;
}

function buildProgressMap(results: Array<Pick<ImageResultRecord, "run_id" | "status" | "error_message">>) {
  const progressMap = new Map<string, QueueRunProgress & { latestErrorMessage: string | null }>();

  for (const result of results) {
    const current = progressMap.get(result.run_id) ?? {
      total: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      latestErrorMessage: null,
    };

    current.total += 1;

    if (result.status === "queued") {
      current.queued += 1;
    }

    if (result.status === "processing") {
      current.processing += 1;
    }

    if (result.status === "completed") {
      current.completed += 1;
    }

    if (result.status === "failed") {
      current.failed += 1;
      current.latestErrorMessage = result.error_message ?? current.latestErrorMessage;
    }

    progressMap.set(result.run_id, current);
  }

  return progressMap;
}

async function hydrateQueueRuns(supabase: SupabaseClient, userId: string, runs: ProcessingRunRecord[]) {
  if (runs.length === 0) {
    return [] satisfies QueueRunSummary[];
  }

  const batchIds = [...new Set(runs.map((run) => run.batch_id))];
  const targetImageIds = [...new Set(runs.map((run) => run.target_image_id).filter((value): value is string => Boolean(value)))];

  const [{ data: batches, error: batchError }, { data: images, error: imageError }, { data: results, error: resultError }] = await Promise.all([
    supabase.from("batches").select("id, title").in("id", batchIds).eq("user_id", userId),
    targetImageIds.length > 0 ? supabase.from("batch_images").select("id, original_filename").in("id", targetImageIds).eq("user_id", userId) : Promise.resolve({ data: [], error: null }),
    supabase.from("image_results").select("run_id, status, error_message").in("run_id", runs.map((run) => run.id)).eq("user_id", userId),
  ]);

  if (batchError) {
    throw batchError;
  }

  if (imageError) {
    throw imageError;
  }

  if (resultError) {
    throw resultError;
  }

  const batchTitleMap = new Map((batches ?? []).map((batch: { id: string; title: string }) => [batch.id, batch.title]));
  const imageNameMap = new Map((images ?? []).map((image: { id: string; original_filename: string }) => [image.id, image.original_filename]));
  const progressMap = buildProgressMap((results ?? []) as Array<Pick<ImageResultRecord, "run_id" | "status" | "error_message">>);

  return runs.map((run) => {
    const progress = progressMap.get(run.id) ?? {
      total: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      latestErrorMessage: null,
    };

    return {
      id: run.id,
      batch_id: run.batch_id,
      batch_title: batchTitleMap.get(run.batch_id) ?? "Untitled batch",
      target_image_id: run.target_image_id,
      target_image_name: run.target_image_id ? imageNameMap.get(run.target_image_id) ?? null : null,
      run_scope: run.run_scope,
      status: run.status,
      created_at: run.created_at,
      started_at: run.started_at,
      completed_at: run.completed_at,
      error_message: progress.latestErrorMessage ?? run.error_message,
      total: progress.total,
      queued: progress.queued,
      processing: progress.processing,
      completed: progress.completed,
      failed: progress.failed,
    } satisfies QueueRunSummary;
  });
}

export async function getUserQueueSummary(supabase: SupabaseClient, userId: string): Promise<QueueSummary> {
  const [{ data: activeRuns, error: activeError }, { data: failedRuns, error: failureError }, { data: historyRuns, error: historyError }] = await Promise.all([
    supabase
      .from("processing_runs")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["queued", "processing"])
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("processing_runs")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("processing_runs")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["completed", "failed"])
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (activeError) {
    throw activeError;
  }

  if (failureError) {
    throw failureError;
  }

  if (historyError) {
    throw historyError;
  }

  const [hydratedActiveRuns, hydratedFailedRuns, hydratedHistoryRuns] = await Promise.all([
    hydrateQueueRuns(supabase, userId, (activeRuns ?? []) as ProcessingRunRecord[]),
    hydrateQueueRuns(supabase, userId, (failedRuns ?? []) as ProcessingRunRecord[]),
    hydrateQueueRuns(supabase, userId, (historyRuns ?? []) as ProcessingRunRecord[]),
  ]);

  return {
    active_runs: hydratedActiveRuns,
    recent_history: hydratedHistoryRuns,
    recent_failures: hydratedFailedRuns,
  };
}
