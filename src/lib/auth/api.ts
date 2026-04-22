import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ApiSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type ApiAuthFailure = {
  response: NextResponse;
};

type ApiAuthSuccess = {
  supabase: ApiSupabaseClient;
  user: User;
};

export async function requireApiUser(): Promise<ApiAuthFailure | ApiAuthSuccess> {
  if (!isSupabaseConfigured()) {
    return {
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user };
}