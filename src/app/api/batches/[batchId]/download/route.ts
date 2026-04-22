import JSZip from "jszip";
import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import type { ImageResultRecord } from "@/lib/db/types";
import { getStorageBucketName } from "@/lib/supabase/config";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const storageBucket = getStorageBucketName();
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth;

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("title")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { data: images, error: imageError } = await supabase
    .from("batch_images")
    .select("id, original_filename")
    .eq("batch_id", batchId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const imageIds = (images ?? []).map((image) => image.id);
  if (imageIds.length === 0) {
    return NextResponse.json({ error: "No images are attached to this batch." }, { status: 400 });
  }

  const { data: results, error: resultError } = await supabase
    .from("image_results")
    .select("*")
    .in("image_id", imageIds)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (resultError) {
    return NextResponse.json({ error: resultError.message }, { status: 500 });
  }

  const latestByImage = new Map<string, ImageResultRecord>();
  for (const result of (results ?? []) as ImageResultRecord[]) {
    if (!latestByImage.has(result.image_id)) {
      latestByImage.set(result.image_id, result);
    }
  }

  const zip = new JSZip();

  for (const image of images ?? []) {
    const result = latestByImage.get(image.id);
    if (!result?.output_storage_path) {
      continue;
    }

    const { data: blob, error: downloadError } = await supabase.storage.from(storageBucket).download(result.output_storage_path);
    if (downloadError || !blob) {
      continue;
    }

    zip.file(image.original_filename, await blob.arrayBuffer());
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const zipBlob = new Blob([zipBuffer], { type: "application/zip" });

  return new NextResponse(zipBlob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${batch.title.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase()}-${batchId}.zip"`,
    },
  });
}
