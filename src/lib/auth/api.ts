import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseAuthSessionCookie } from "@/lib/auth/middleware-policy";
import { requireUser, type RequiredUserContext } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ApiAuthFailure = {
  response: NextResponse;
};

type ApiSessionSuccess = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
};

type ApiAuthSuccess = {
  supabase: RequiredUserContext["supabase"];
  user: User;
};

export async function requireApiSession(): Promise<ApiAuthFailure | ApiSessionSuccess> {
  if (!isSupabaseConfigured()) {
    return {
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  const cookieStore = await cookies();
  if (!hasSupabaseAuthSessionCookie(cookieStore.getAll().map((cookie) => cookie.name))) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    supabase: await createServerSupabaseClient(),
  };
}

export async function requireApiUser(): Promise<ApiAuthFailure | ApiAuthSuccess> {
  const auth = await requireUser();

  if (!("kind" in auth)) {
    return auth;
  }

  if (auth.kind === "unconfigured") {
    return {
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  return {
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}