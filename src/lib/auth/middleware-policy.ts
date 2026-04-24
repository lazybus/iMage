const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/acceptable-use",
  "/cookies",
  "/legal",
  "/login",
  "/privacy",
  "/register",
  "/terms",
]);

const PUBLIC_PREFIXES = ["/auth/callback"] as const;
const SUPABASE_AUTH_COOKIE_PATTERN = /^(?:__Host-|__Secure-)?sb-.*-auth-token(?:\.\d+)?$/;

type AuthGateDecision =
  | { kind: "allow" }
  | { kind: "redirect-login"; location: string };

function shouldFailClosedWhenUnconfigured(runtimeMode: string | undefined) {
  return runtimeMode === "production";
}

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function hasSupabaseAuthSessionCookie(cookieNames: string[]) {
  return cookieNames.some((name) => SUPABASE_AUTH_COOKIE_PATTERN.test(name));
}

export function resolveAuthGateDecision({
  pathname,
  requestUrl,
  isSupabaseConfigured,
  isAuthenticated,
  runtimeMode,
}: {
  pathname: string;
  requestUrl: string;
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  runtimeMode?: string;
}): AuthGateDecision {
  if (isPublicPath(pathname) || isAuthenticated) {
    return { kind: "allow" };
  }

  if (!isSupabaseConfigured) {
    if (!shouldFailClosedWhenUnconfigured(runtimeMode)) {
      return { kind: "allow" };
    }

    const unavailableUrl = new URL("/login", requestUrl);
    unavailableUrl.searchParams.set("message", "Authentication is currently unavailable.");
    unavailableUrl.searchParams.set("next", pathname);

    return {
      kind: "redirect-login",
      location: unavailableUrl.toString(),
    };
  }

  const loginUrl = new URL("/login", requestUrl);
  loginUrl.searchParams.set("message", "Please sign in to continue.");
  loginUrl.searchParams.set("next", pathname);

  return {
    kind: "redirect-login",
    location: loginUrl.toString(),
  };
}