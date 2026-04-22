import assert from "node:assert/strict";
import test from "node:test";

import { isPublicPath, resolveAuthGateDecision } from "./middleware-policy";

const APP_ORIGIN = "https://example.com";

test("known public routes stay public", () => {
  const publicPaths = [
    "/",
    "/about",
    "/acceptable-use",
    "/cookies",
    "/legal",
    "/privacy",
    "/terms",
    "/login",
    "/register",
    "/auth/callback",
    "/auth/callback/provider/google",
  ];

  for (const pathname of publicPaths) {
    assert.equal(isPublicPath(pathname), true, `${pathname} should be public`);
    assert.deepEqual(
      resolveAuthGateDecision({
        pathname,
        requestUrl: `${APP_ORIGIN}${pathname}`,
        isSupabaseConfigured: true,
        isAuthenticated: false,
        runtimeMode: "production",
      }),
      { kind: "allow" },
    );
  }
});

test("private pages redirect unauthenticated users to login with next path", () => {
  const decision = resolveAuthGateDecision({
    pathname: "/batches/new",
    requestUrl: `${APP_ORIGIN}/batches/new`,
    isSupabaseConfigured: true,
    isAuthenticated: false,
    runtimeMode: "production",
  });

  assert.equal(decision.kind, "redirect-login");
  if (decision.kind !== "redirect-login") {
    return;
  }

  const redirectUrl = new URL(decision.location);
  assert.equal(redirectUrl.pathname, "/login");
  assert.equal(redirectUrl.searchParams.get("message"), "Please sign in to continue.");
  assert.equal(redirectUrl.searchParams.get("next"), "/batches/new");
});

test("private API routes return unauthorized decisions for anonymous requests", () => {
  assert.deepEqual(
    resolveAuthGateDecision({
      pathname: "/api/queue",
      requestUrl: `${APP_ORIGIN}/api/queue`,
      isSupabaseConfigured: true,
      isAuthenticated: false,
      runtimeMode: "production",
    }),
    { kind: "api-unauthorized" },
  );
});

test("authenticated requests are allowed through private routes", () => {
  assert.deepEqual(
    resolveAuthGateDecision({
      pathname: "/api/images/123/run",
      requestUrl: `${APP_ORIGIN}/api/images/123/run`,
      isSupabaseConfigured: true,
      isAuthenticated: true,
      runtimeMode: "production",
    }),
    { kind: "allow" },
  );
});

test("unknown routes default to private", () => {
  const decision = resolveAuthGateDecision({
    pathname: "/internal/reports",
    requestUrl: `${APP_ORIGIN}/internal/reports`,
    isSupabaseConfigured: true,
    isAuthenticated: false,
    runtimeMode: "production",
  });

  assert.equal(decision.kind, "redirect-login");
});

test("middleware stays permissive in development when Supabase is not configured", () => {
  assert.deepEqual(
    resolveAuthGateDecision({
      pathname: "/batches",
      requestUrl: `${APP_ORIGIN}/batches`,
      isSupabaseConfigured: false,
      isAuthenticated: false,
      runtimeMode: "development",
    }),
    { kind: "allow" },
  );
});

test("middleware fail-closes private pages in production when Supabase is not configured", () => {
  const decision = resolveAuthGateDecision({
    pathname: "/batches",
    requestUrl: `${APP_ORIGIN}/batches`,
    isSupabaseConfigured: false,
    isAuthenticated: false,
    runtimeMode: "production",
  });

  assert.equal(decision.kind, "redirect-login");
  if (decision.kind !== "redirect-login") {
    return;
  }

  const redirectUrl = new URL(decision.location);
  assert.equal(redirectUrl.pathname, "/login");
  assert.equal(redirectUrl.searchParams.get("message"), "Authentication is currently unavailable.");
  assert.equal(redirectUrl.searchParams.get("next"), "/batches");
});

test("middleware fail-closes private APIs in production when Supabase is not configured", () => {
  assert.deepEqual(
    resolveAuthGateDecision({
      pathname: "/api/queue",
      requestUrl: `${APP_ORIGIN}/api/queue`,
      isSupabaseConfigured: false,
      isAuthenticated: false,
      runtimeMode: "production",
    }),
    { kind: "api-unavailable", error: "Supabase authentication is not configured." },
  );
});