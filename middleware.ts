import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseAuthSessionCookie, isPublicPath, resolveAuthGateDecision } from "@/lib/auth/middleware-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function middleware(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const decision = resolveAuthGateDecision({
    pathname: request.nextUrl.pathname,
    requestUrl: request.url,
    isSupabaseConfigured: isSupabaseConfigured(),
    isAuthenticated: hasSupabaseAuthSessionCookie(request.cookies.getAll().map((cookie) => cookie.name)),
    runtimeMode: process.env.NODE_ENV,
  });

  if (decision.kind === "allow") {
    return NextResponse.next();
  }

  return NextResponse.redirect(decision.location);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};