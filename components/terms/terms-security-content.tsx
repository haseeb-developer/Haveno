"use client";

import { motion } from "framer-motion";
import { KeyRound, RotateCcw, ShieldCheck, ShieldOff } from "lucide-react";
import { BRAND } from "@/constants/copy";

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: "Zero-knowledge encryption",
    body: `${BRAND.name} encrypts every saved password on your device before it's ever sent anywhere. We only ever store encrypted data — not your passwords, not your usernames, not your Vault Passphrase. Nobody at ${BRAND.name}, including with full database access, can read your saved passwords.`,
  },
  {
    icon: KeyRound,
    title: "Your Vault Passphrase is irreplaceable",
    body: `Your Vault Passphrase is separate from your account password, and it's the only key that unlocks your vault. ${BRAND.name} never receives it, never stores it, and cannot see it. This means if you forget it, ${BRAND.name} cannot decrypt your existing vault for you — there is no "reset my password" email that gets your old data back, because we never had a way to read it in the first place.`,
  },
  {
    icon: RotateCcw,
    title: 'What "forgot your passphrase" actually does',
    body: `If you lose your Vault Passphrase, the only way forward is to permanently delete your existing encrypted vault and start a new one with a new passphrase. This is not a normal password reset — your previously saved passwords are not recovered by this process, because they can't be. It creates a fresh, empty vault.`,
  },
  {
    icon: ShieldOff,
    title: "What this means in practice",
    body: "Treat your Vault Passphrase with real care — write it down somewhere safe, use a memorable but strong phrase, or generate one and store it securely. There is no account-recovery path that restores a forgotten passphrase's vault, on purpose. That trade-off is what makes the encryption meaningful in the first place.",
  },
] as const;

export function TermsSecurityContent() {
  return (
    <div className="space-y-5">
      {SECTIONS.map((section, i) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className="flex gap-4 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
            <section.icon className="h-4.5 w-4.5 text-vault-gold" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              {section.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
