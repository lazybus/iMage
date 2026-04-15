export interface ProviderSubmitInput {
  sourcePath: string;
  prompt: string;
  upscale: boolean;
}

export interface ProviderSubmittedJob {
  providerJobId: string;
  rawPayload: Record<string, unknown>;
}

export interface ProviderStatusResult {
  status: "queued" | "processing" | "completed" | "failed";
  outputUrl?: string;
  width?: number;
  height?: number;
  rawPayload?: Record<string, unknown>;
  errorMessage?: string;
}

export interface ImageProvider {
  submitEdit(input: ProviderSubmitInput): Promise<ProviderSubmittedJob>;
  getJobStatus(providerJobId: string): Promise<ProviderStatusResult>;
}
