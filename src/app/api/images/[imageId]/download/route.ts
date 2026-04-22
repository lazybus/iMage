import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import { getStorageBucketName } from "@/lib/supabase/config";

export async function GET(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await params;
  const { searchParams } = new URL(request.url);
  const preferUpscaled = searchParams.get("variant") === "upscaled";
  const storageBucket = getStorageBucketName();
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth;

  const { data: image, error: imageError } = await supabase
    .from("batch_images")
    .select("original_filename")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .single();

  if (imageError || !image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const { data: results, error: resultError } = await supabase
    .from("image_results")
    .select("*")
    .eq("image_id", imageId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (resultError || !results?.[0]) {
    return NextResponse.json({ error: "No completed result available." }, { status: 404 });
  }

  const result = results[0];
  const selectedPath = preferUpscaled && result.upscaled_output_storage_path ? result.upscaled_output_storage_path : result.output_storage_path;

  if (!selectedPath) {
    return NextResponse.json({ error: "The selected output path is empty." }, { status: 404 });
  }

  const { data: blob, error: downloadError } = await supabase.storage.from(storageBucket).download(selectedPath);

  if (downloadError || !blob) {
    return NextResponse.json({ error: downloadError?.message ?? "Unable to download image." }, { status: 500 });
  }

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${image.original_filename}"`,
    },
  });
}
