import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";

type ImagePatchHandlerDependencies = {
  requireApiUser: typeof requireApiUser;
};

export function createImagePatchHandler(dependencies: ImagePatchHandlerDependencies = { requireApiUser }) {
  return async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = await params;
    const payload = (await request.json().catch(() => ({}))) as { editPrompt?: string };
    const editPrompt = payload.editPrompt?.trim();

    if (!editPrompt) {
      return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
    }

    const auth = await dependencies.requireApiUser();
    if ("response" in auth) {
      return auth.response;
    }

    const { supabase, user } = auth;

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
  };
}