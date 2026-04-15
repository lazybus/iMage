import { NanoBananaProvider } from "../../../src/lib/providers/nano-banana";

export default async function handler() {
  const provider = new NanoBananaProvider();

  return new Response(
    JSON.stringify({
      message: "Hook this function up to queued image_results polling.",
      providerConfigured: Boolean(provider),
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}