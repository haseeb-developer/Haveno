import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";

/**
 * Handles the redirect from Supabase after a user clicks a link that
 * carries a PKCE `code` param — used for the password-reset flow and any
 * OAuth providers added later. Exchanges the code for a session, then
 * forwards the user to their intended destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.dashboard;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const failureUrl = new URL(ROUTES.login, origin);
  failureUrl.searchParams.set("error", "auth-callback-failed");
  return NextResponse.redirect(failureUrl);
}
