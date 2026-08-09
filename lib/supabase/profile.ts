import { createClient } from "@/lib/supabase/client";

/** Records that the given user has acknowledged the Terms & Security page. */
export async function acknowledgeTerms(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ terms_acknowledged_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}
