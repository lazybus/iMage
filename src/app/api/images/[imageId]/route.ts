import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { imageId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { editPrompt?: string };
  const editPrompt = payload.editPrompt?.trim();

  if (!editPrompt) {
    return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: image, error } = await supabase
    .from("batch_images")
    .update({ edit_prompt: editPrompt })
    .eq("id", imageId)
    .eq("user_id", user.id)
    .select("id, edit_prompt")
    .single();

  if (error || !image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return NextResponse.json(image);
}