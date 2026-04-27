import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import { createBatchRecord } from "@/lib/db/queries";
import { buildOriginalPath } from "@/lib/storage/paths";
import { getStorageBucketName } from "@/lib/supabase/config";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { title?: string };
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth;
  const title = payload.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "A title is required to duplicate this batch." }, { status: 400 });
  }

  const { data: sourceBatch, error: batchError } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single();

  if (batchError || !sourceBatch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { data: sourceImages, error: imageError } = await supabase
    .from("batch_images")
    .select("original_filename, input_storage_path, edit_prompt, sort_order")
    .eq("batch_id", batchId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const storageBucket = getStorageBucketName();
  const duplicatedBatch = await createBatchRecord(supabase, user, title);
  const uploadedPaths: string[] = [];

  try {
    const imageRows = [];

    for (const [index, sourceImage] of (sourceImages ?? []).entries()) {
      const sourcePath = sourceImage.input_storage_path;
      const duplicatedPath = buildOriginalPath(user.id, duplicatedBatch.id, index, sourceImage.original_filename);
      const { data: originalBlob, error: downloadError } = await supabase.storage.from(storageBucket).download(sourcePath);

      if (downloadError || !originalBlob) {
        throw new Error(downloadError?.message ?? `Unable to copy ${sourcePath}.`);
      }

      const { error: uploadError } = await supabase.storage.from(storageBucket).upload(duplicatedPath, Buffer.from(await originalBlob.arrayBuffer()), {
        contentType: originalBlob.type || "application/octet-stream",
        upsert: false,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(duplicatedPath);
      imageRows.push({
        batch_id: duplicatedBatch.id,
        user_id: user.id,
        original_filename: sourceImage.original_filename,
        input_storage_path: duplicatedPath,
        edit_prompt: sourceImage.edit_prompt,
        status: "ready",
        sort_order: sourceImage.sort_order,
      });
    }

    if (imageRows.length > 0) {
      const { error: insertError } = await supabase.from("batch_images").insert(imageRows);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ batchId: duplicatedBatch.id }, { status: 201 });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(storageBucket).remove(uploadedPaths);
    }

    await supabase.from("batches").delete().eq("id", duplicatedBatch.id).eq("user_id", user.id);

    const message = error instanceof Error ? error.message : "Unable to duplicate batch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth;
  const storageBucket = getStorageBucketName();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { data: images, error: imageError } = await supabase
    .from("batch_images")
    .select("id, input_storage_path")
    .eq("batch_id", batchId)
    .eq("user_id", user.id);

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const imageIds = (images ?? []).map((image) => image.id);
  let resultPaths: Array<string | null> = [];

  if (imageIds.length > 0) {
    const { data: results, error: resultError } = await supabase
      .from("image_results")
      .select("output_storage_path, upscaled_output_storage_path")
      .in("image_id", imageIds)
      .eq("user_id", user.id);

    if (resultError) {
      return NextResponse.json({ error: resultError.message }, { status: 500 });
    }

    resultPaths = (results ?? []).flatMap((result) => [result.output_storage_path, result.upscaled_output_storage_path]);
  }

  const storagePaths = [...new Set([...(images ?? []).map((image) => image.input_storage_path), ...resultPaths].filter((path): path is string => Boolean(path)))];

  if (storagePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(storageBucket).remove(storagePaths);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase.from("batches").delete().eq("id", batchId).eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}