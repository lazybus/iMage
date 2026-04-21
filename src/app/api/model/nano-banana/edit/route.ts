import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { NanoBananaProvider } from "@/lib/providers/nano-banana";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  const prompt = formData.get("prompt")?.toString().trim();
  const imageFile = formData.get("imageFile");

  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }

  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }

  const provider = new NanoBananaProvider();
  const imageBase64 = Buffer.from(await imageFile.arrayBuffer()).toString("base64");

  try {
    const result = await provider.editImage({
      prompt,
      imageBase64,
      imageMimeType: imageFile.type || "image/png",
    });

    return NextResponse.json({
      image: result.image,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "The Nano Banana edit request failed.",
      },
      { status: 500 },
    );
  }
}