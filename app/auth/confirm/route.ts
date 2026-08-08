import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";

/**
 * Handles Supabase email-confirmation links. Supabase can deliver either
 * format depending on your project's Auth settings and email template:
 *
 * - `token_hash` + `type` — the classic OTP-verification format used by
 *   the default Supabase email templates when they link straight to your
 *   site.
 * - `code` — the PKCE format, which is what you'll get whenever a client
 *   created with @supabase/ssr (as this app uses) triggers the email via
 *   `emailRedirectTo`. This is the common case for sign-up confirmation.
 *
 * Handling both here means confirmation links work regardless of which
 * format your project's email template produces, with no dashboard
 * template edits required.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.dashboard;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const failureUrl = new URL(ROUTES.login, origin);
  failureUrl.searchParams.set("error", "verification-failed");
  return NextResponse.redirect(failureUrl);
}
