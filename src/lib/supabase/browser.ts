"use client";

import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  client ??= createBrowserClient(supabaseEnv.url, supabaseEnv.publishableKey);
  return client;
}
