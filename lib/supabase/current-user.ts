import { headers } from "next/headers";
import type { AuthUser } from "@/types/auth";

/**
 * The header middleware uses to forward the already-verified user to
 * Server Components. Exported so middleware.ts and this file share the
 * exact same name — never hardcode the string in more than one place.
 */
export const REQUEST_USER_HEADER = "x-havenoo-user";

/**
 * Reads the user that middleware already verified for this request,
 * instead of calling supabase.auth.getUser() again.
 *
 * Every getUser() call is a real network round-trip to Supabase (it
 * verifies the session JWT server-side, unlike getSession() which only
 * decodes it locally). Middleware already does this once, per request, for
 * every route. Server Components that need the current user — root
 * layout, the dashboard guard, etc. — should read it from here rather
 * than re-verifying it themselves; doing so was the actual cause of a
 * several-second delay on every login and page load, since Next renders
 * nested layouts sequentially and each redundant call stacked on top of
 * the last.
 *
 * This is safe to trust: middleware unconditionally sets or deletes this
 * exact header based on its own verified result before forwarding the
 * request onward, so a client can never inject its own value here.
 */
export async function getRequestUser(): Promise<AuthUser | null> {
  const headerStore = await headers();
  const encoded = headerStore.get(REQUEST_USER_HEADER);
  if (!encoded) return null;

  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}
