import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AUTH_COPY } from "@/constants/copy";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Verify your email — Haveno" };

export default function VerifyEmailPage() {
  const copy = AUTH_COPY.verifyEmail;

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <Link
          href={ROUTES.login}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-state-success-dim">
          <MailCheck className="h-5 w-5 text-state-success" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Didn&apos;t get an email? Check your spam folder, or head back to
          sign in and use &quot;Forgot password&quot; if you&apos;re not sure
          which address you used.
        </p>
      </div>
    </AuthShell>
  );
}
