import type { NextConfig } from "next";

/**
 * The Content-Security-Policy header is NOT set here. Next.js's App
 * Router streams hydration data through inline <script> tags it generates
 * itself, and those need a fresh nonce on every single request — which a
 * static header in this file can't produce. The CSP is instead built
 * per-request in lib/supabase/middleware.ts, right alongside the existing
 * Supabase session middleware, and includes the nonce Next.js needs to
 * trust its own inline scripts.
 *
 * The headers below don't need per-request values, so they're fine as
 * static config here.
 */
const staticSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: staticSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
