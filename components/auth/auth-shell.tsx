"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { VaultDial } from "@/components/auth/vault-dial";
import { BRAND } from "@/constants/copy";
import { ROUTES } from "@/constants/routes";

const PANEL_POINTS = [
  {
    title: "End-to-end by design",
    body: "Every session is verified through Supabase's hardened authentication layer — no custom login code, no shortcuts.",
  },
  {
    title: "Built for the long haul",
    body: "Session persistence and silent refresh keep you signed in exactly as long as you want to be, and not a moment longer.",
  },
  {
    title: "A calm surface for a serious job",
    body: "Protecting credentials shouldn't feel like a chore. Haveno keeps the experience quiet, precise, and fast.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-porcelain dark:bg-ink">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink px-14 py-12 text-text-primary lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,169,97,0.08),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(91,122,140,0.1),transparent_50%)]" />

        <Link
          href={ROUTES.home}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-vault-gold/30 bg-ink-elevated">
            <ShieldCheck className="h-4.5 w-4.5 text-vault-gold" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <div className="relative z-10 mx-auto w-full max-w-sm py-16">
          <VaultDial state="idle" />
        </div>

        <div className="relative z-10 space-y-8">
          <p className="font-display text-2xl font-medium leading-snug tracking-tight text-text-primary">
            {BRAND.tagline}
          </p>
          <div className="space-y-5 border-t border-ink-border pt-6">
            {PANEL_POINTS.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              >
                <p className="text-sm font-medium text-text-primary">
                  {point.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {point.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-vault-gold/30 bg-ink-elevated">
            <ShieldCheck className="h-4.5 w-4.5 text-vault-gold" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {BRAND.name}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
              {eyebrow}
            </p>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {children}

          {footer && <div className="mt-8">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}
