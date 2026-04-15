export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  secretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "image-documents",
};

export function isSupabaseConfigured() {
  return Boolean(supabaseEnv.url && supabaseEnv.publishableKey);
}

export function getStorageBucketName() {
  return supabaseEnv.storageBucket;
}
