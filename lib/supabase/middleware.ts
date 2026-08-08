import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ONLY_ROUTES, PUBLIC_ROUTES, ROUTES } from "@/constants/routes";
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
 * protection at the edge, and attaches a fresh-nonce CSP to every
 * response. This runs before any page renders, so protected pages never
 * flash their content to an unauthenticated visitor.
 */
export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          supabaseResponse.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
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

  // IMPORTANT: You must return the supabaseResponse object as is. If you
  // create a new response object, make sure to copy the cookies over, or
  // the browser and server will get out of sync and the session will end
  // prematurely.
  return supabaseResponse;
}
