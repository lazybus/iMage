import { randomUUID } from "node:crypto";

import type { ImageProvider, ProviderStatusResult, ProviderSubmitInput, ProviderSubmittedJob } from "@/lib/providers/image-provider";

interface NanoBananaImageResult {
  imageBytes: string;
  mimeType: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: Record<string, unknown>;
}

export class NanoBananaProvider implements ImageProvider {
  constructor(
    private readonly apiUrl = process.env.NANO_BANANA_API_URL ?? "https://generativelanguage.googleapis.com/v1beta/models",
    private readonly apiKey = process.env.NANO_BANANA_API_KEY,
    private readonly model = process.env.NANO_BANANA_MODEL ?? "gemini-2.5-flash-image-preview",
  ) {}

  async submitEdit(input: ProviderSubmitInput): Promise<ProviderSubmittedJob> {
    throw new Error(
      `Nano Banana submitEdit is not connected to the queue worker yet. The current provider is configured for direct Google AI Studio edits, but the worker still needs to download ${input.sourcePath} from Supabase Storage before it can submit the model request.`,
    );
  }

  async getJobStatus(providerJobId: string): Promise<ProviderStatusResult> {
    return {
      status: "failed",
      errorMessage: "Google AI Studio image editing is currently handled synchronously through the direct edit route, not by polling provider job status.",
      rawPayload: {
        providerJobId,
      },
    };
  }

  async editImage(params: { prompt: string; imageBase64: string; imageMimeType: string }) {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error("Nano Banana credentials are not configured.");
    }

    const endpoint = `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: params.prompt },
              {
                inlineData: {
                  mimeType: params.imageMimeType,
                  data: params.imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | { error?: { message?: string } } | null;

    if (!response.ok) {
      throw new Error(payload && "error" in payload ? payload.error?.message ?? "Google AI Studio rejected the request." : "Google AI Studio rejected the request.");
    }

    const image = this.extractImageFromResponse(payload as GeminiGenerateContentResponse);
    if (!image) {
      throw new Error("Google AI Studio returned no image data for the edit request.");
    }

    return {
      providerJobId: randomUUID(),
      image,
      rawPayload: payload as Record<string, unknown>,
    };
  }

  private extractImageFromResponse(payload: GeminiGenerateContentResponse): NanoBananaImageResult | null {
    for (const candidate of payload.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return {
            imageBytes: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? "image/png",
          };
        }
      }
    }

    return null;
  }
}

