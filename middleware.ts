import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath, resolveAuthGateDecision } from "@/lib/auth/middleware-policy";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const isConfigured = isSupabaseConfigured();
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!isConfigured) {
    const decision = resolveAuthGateDecision({
      pathname: request.nextUrl.pathname,
      requestUrl: request.url,
      isSupabaseConfigured: false,
      isAuthenticated: false,
      runtimeMode: process.env.NODE_ENV,
    });

    if (decision.kind === "allow") {
      return NextResponse.next();
    }

    if (decision.kind === "api-unavailable") {
      return NextResponse.json({ error: decision.error }, { status: 503 });
    }

    if (decision.kind === "api-unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(decision.location);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseEnv.url, supabaseEnv.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const decision = resolveAuthGateDecision({
    pathname: request.nextUrl.pathname,
    requestUrl: request.url,
    isSupabaseConfigured: isConfigured,
    isAuthenticated: Boolean(user),
    runtimeMode: process.env.NODE_ENV,
  });

  if (decision.kind === "allow") {
    return response;
  }

  if (decision.kind === "api-unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decision.kind === "api-unavailable") {
    return NextResponse.json({ error: decision.error }, { status: 503 });
  }

  return NextResponse.redirect(decision.location);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};