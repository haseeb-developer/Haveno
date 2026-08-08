"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 45;

export function ResendVerificationButton({ email }: { email: string }) {
  const supabase = createClient();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setIsSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setIsSending(false);

    if (error) {
      toast.error("Couldn't resend the email", { description: error.message });
      return;
    }

    toast.success("Verification email resent");
    setCooldown(COOLDOWN_SECONDS);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleResend}
      isLoading={isSending}
      disabled={cooldown > 0}
    >
      {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend email"}
    </Button>
  );
}
