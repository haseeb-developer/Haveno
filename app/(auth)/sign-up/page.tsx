import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_COPY } from "@/constants/copy";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Create account — Haveno" };

export default function SignUpPage() {
  const copy = AUTH_COPY.signUp;

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-vault-gold transition-colors hover:text-vault-gold-bright"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
