import { createClient } from "@/lib/supabase/server";

/**
 * Whether the current user has acknowledged Havenoo's Terms & Security
 * information. Server-only (uses next/headers via the Supabase server
 * client) — kept in its own file so it's never accidentally pulled into
 * a client bundle by something that also imports the client-side
 * profile helpers from lib/supabase/profile.ts.
 */
export async function fetchTermsAcknowledgedServer(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("terms_acknowledged_at")
    .maybeSingle();

  if (error) throw error;
  return !!data?.terms_acknowledged_at;
}
