import type { NextConfig } from "next";
import os from "node:os";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hostnames = new Set(
  ["localhost", "127.0.0.1", os.hostname(), process.env.COMPUTERNAME, process.env.HOSTNAME]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase()),
);
const supabaseRemotePattern = supabaseUrl
  ? (() => {
      const { hostname, port, protocol } = new URL(supabaseUrl);

      return {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/**",
      };
    })()
  : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: [...hostnames],
  images: {
    remotePatterns: supabaseRemotePattern ? [supabaseRemotePattern] : [],
  },
  typedRoutes: true,
};

export default nextConfig;
