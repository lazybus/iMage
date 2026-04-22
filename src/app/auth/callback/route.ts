import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?message=Supabase+is+not+configured", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next");
  const redirectPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/batches";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(error.message)}&next=${encodeURIComponent(redirectPath)}`);
    }
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
