import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { BatchImageRecord, BatchRecord, BatchWithImages, ImageResultRecord } from "@/lib/db/types";

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
