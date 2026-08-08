import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AUTH_COPY } from "@/constants/copy";

export const metadata: Metadata = { title: "Set new password — Haveno" };

export default function ResetPasswordPage() {
  const copy = AUTH_COPY.resetPassword;

  return (
    <AuthShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
