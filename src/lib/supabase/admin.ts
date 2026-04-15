import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/config";

export function createAdminSupabaseClient() {
  if (!supabaseEnv.url || !supabaseEnv.secretKey) {
    throw new Error("Missing Supabase secret key environment variables.");
  }

  return createClient(supabaseEnv.url, supabaseEnv.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
