import { NextResponse } from "next/server";

import { createBatchRecord } from "@/lib/db/queries";
import { buildOriginalPath } from "@/lib/storage/paths";
import { getStorageBucketName, isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const WEBP_MIME_TYPE = "image/webp";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ batches: data });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const storageBucket = getStorageBucketName();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  const prompts = formData.getAll("prompts").map((value) => value.toString());
  const title = formData.get("title")?.toString().trim() || `Batch ${new Date().toLocaleDateString()}`;

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
  }

  for (const [index, file] of files.entries()) {
    if (file.type !== WEBP_MIME_TYPE) {
      return NextResponse.json(
        {
          error: `Image ${index + 1} must be optimized to WebP before upload.`,
        },
        { status: 400 },
      );
    }
  }

  const batch = await createBatchRecord(supabase, user, title);

  const imageRows = [];

  for (const [index, file] of files.entries()) {
    const prompt = prompts[index]?.trim();
    if (!prompt) {
      return NextResponse.json({ error: `Missing prompt for image ${index + 1}.` }, { status: 400 });
    }

    const path = buildOriginalPath(user.id, batch.id, index, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    imageRows.push({
      batch_id: batch.id,
      user_id: user.id,
      original_filename: file.name,
      input_storage_path: path,
      edit_prompt: prompt,
      status: "ready",
      sort_order: index,
    });
  }

  const { error: insertError } = await supabase.from("batch_images").insert(imageRows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ batchId: batch.id });
}
