import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COPY } from "@/constants/copy";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Sign in — Havenoo" };

export default function LoginPage() {
  const copy = AUTH_COPY.login;

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to Havenoo?{" "}
          <Link
            href={ROUTES.signUp}
            className="font-medium text-vault-gold transition-colors hover:text-vault-gold-bright"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
