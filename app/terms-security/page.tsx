import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { TermsSecurityContent } from "@/components/terms/terms-security-content";
import { BRAND } from "@/constants/copy";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = { title: "Terms & Security — Havenoo" };

export default function TermsSecurityPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link
        href={ROUTES.dashboard}
        className="mb-8 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to vault
      </Link>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-vault-gold/30 bg-accent">
          <ShieldCheck className="h-5 w-5 text-vault-gold" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
          Reference
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Terms &amp; Security
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          How {BRAND.name}&apos;s zero-knowledge encryption works, and what
          it means for your Vault Passphrase.
        </p>
      </div>

      <TermsSecurityContent />
    </main>
  );
}
