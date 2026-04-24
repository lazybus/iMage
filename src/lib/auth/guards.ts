import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type RequiredUserContext = {
  supabase: ServerSupabaseClient;
  user: NonNullable<Awaited<ReturnType<ServerSupabaseClient["auth"]["getUser"]>>["data"]["user"]>;
};

export type RequireUserFailure =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" };

export const getOptionalUser = cache(async () => {
  if (!isSupabaseConfigured()) {
    return { supabase: null, user: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});

export async function requireUser(): Promise<RequireUserFailure | RequiredUserContext> {
  const { supabase, user } = await getOptionalUser();

  if (!supabase || !user) {
    return {
      kind: supabase ? "unauthenticated" : "unconfigured",
    };
  }

  return { supabase, user };
}

export async function requirePageUser(): Promise<RequiredUserContext> {
  const auth = await requireUser();

  if ("kind" in auth) {
    redirect("/login");
  }

  return auth;
}
