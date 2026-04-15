export type BatchStatus = "draft" | "ready" | "queued" | "processing" | "completed" | "failed";
export type RunScope = "single" | "batch";

export interface BatchRecord {
  id: string;
  user_id: string;
  title: string;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
}

export interface BatchImageRecord {
  id: string;
  batch_id: string;
  user_id: string;
  original_filename: string;
  input_storage_path: string;
  edit_prompt: string;
  status: BatchStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessingRunRecord {
  id: string;
  batch_id: string;
  user_id: string;
  target_image_id: string | null;
  run_scope: RunScope;
  status: BatchStatus;
  upscale_requested: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ImageResultRecord {
  id: string;
  image_id: string;
  run_id: string;
  user_id: string;
  provider_job_id: string | null;
  output_storage_path: string | null;
  upscaled_output_storage_path: string | null;
  status: BatchStatus;
  output_width: number | null;
  output_height: number | null;
  provider_payload: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchWithImages extends BatchRecord {
  images: Array<BatchImageRecord & { results: ImageResultRecord[] }>;
}
