"use client";

import { motion } from "framer-motion";
import { getPassphraseStrength } from "@/lib/crypto/passphrase-strength";
import { VAULT_PASSPHRASE_MIN_LENGTH } from "@/lib/crypto/constants";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-vault-gold-dim",
  "bg-vault-gold",
  "bg-state-success",
];

export function PassphraseStrengthMeter({ passphrase }: { passphrase: string }) {
  const { score, label, meetsMinimum } = getPassphraseStrength(passphrase);

  if (!passphrase) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ originX: 0 }}
              className={cn("h-full w-full", BAR_COLORS[score])}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {meetsMinimum ? (
          <>
            Strength: <span className="font-medium">{label}</span>
          </>
        ) : (
          <span className="text-destructive">
            Needs at least {VAULT_PASSPHRASE_MIN_LENGTH} characters
          </span>
        )}
      </p>
    </div>
  );
}
