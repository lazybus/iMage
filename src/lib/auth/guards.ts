import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function getOptionalUser() {
  if (!isSupabaseConfigured()) {
    return { supabase: null, user: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getOptionalUser();

  if (!supabase || !user) {
    redirect("/login");
  }

  return { supabase, user };
}
