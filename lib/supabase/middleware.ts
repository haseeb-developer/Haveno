import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ONLY_ROUTES, PUBLIC_ROUTES, ROUTES } from "@/constants/routes";
import { REQUEST_USER_HEADER } from "@/lib/supabase/current-user";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Builds a per-request Content-Security-Policy using a fresh nonce.
 *
 * This has to live here, generated per-request in middleware, rather than
 * as a static header in next.config.ts — Next.js's App Router streams
 * hydration data through inline <script> tags it generates itself, and a
 * strict script-src has no way to allow exactly those (and only those)
 * without a nonce that changes on every request. Next automatically
 * applies this nonce to its own inline scripts once it sees it in the
 * response's Content-Security-Policy header, so no extra wiring is needed
 * beyond setting the header correctly here.
 */
function buildCsp(nonce: string, isDev: boolean) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    // Framer Motion drives animations via inline style="" attributes on
    // arbitrary elements, which nonces can't cover (nonces only apply to
    // <style> elements/<link>, not the style attribute) — 'unsafe-inline'
    // here is a deliberate, low-risk exception: it can't execute script.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google.com",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${
      isDev ? " ws://localhost:*" : ""
    }`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Refreshes the Supabase session on every request, enforces route
 * protection at the edge, attaches a fresh-nonce CSP to every response,
 * and forwards the already-verified user to downstream Server Components.
 *
 * PERFORMANCE NOTE: supabase.auth.getUser() is a real network round-trip
 * (it verifies the session JWT against Supabase, unlike getSession() which
 * only decodes it locally). It happens exactly ONCE, here. Server
 * Components that need the current user should read it via
 * lib/supabase/current-user.ts's getRequestUser() instead of calling
 * getUser() again themselves — every extra call is another full
 * round-trip to Supabase's auth server, stacked sequentially in Next's
 * layout render order, and was the actual cause of a multi-second delay
 * on every navigation before this was fixed.
 *
 * This is safe: the header below is fully controlled by this middleware.
 * `requestHeaders` starts as a copy of the incoming request's headers, but
 * is unconditionally overwritten (set or deleted) below based on the
 * verified result — a client can never make its own copy of this header
 * survive through to a Server Component.
 */
export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.delete(REQUEST_USER_HEADER);

  const cookiesToApply: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies: CookieToSet[]) {
          newCookies.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToApply.push(...newCookies);
        },
      },
    }
  );

  // IMPORTANT: Do not run any logic between createServerClient and
  // getUser(). A simple mistake could make it very hard to debug issues
  // with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    requestHeaders.set(
      REQUEST_USER_HEADER,
      Buffer.from(JSON.stringify(user)).toString("base64")
    );
  }

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!user && !isPublicRoute && pathname !== ROUTES.home) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.login;
    redirectUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  if (user && isAuthOnlyRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.dashboard;
    redirectUrl.search = "";
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // Built once, after the nonce and the verified user are both known, so
  // downstream Server Components see both via next/headers' headers().
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );

  return response;
}
