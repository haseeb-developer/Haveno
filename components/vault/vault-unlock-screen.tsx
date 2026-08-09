"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { useVault } from "@/components/providers/vault-provider";
import { vaultUnlockSchema, type VaultUnlockValues } from "@/lib/validations/vault";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { VaultDial } from "@/components/auth/vault-dial";
import { ResetVaultDialog } from "@/components/vault/reset-vault-dialog";

export function VaultUnlockScreen() {
  const { unlockVault } = useVault();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [dialState, setDialState] = useState<"idle" | "unlocking" | "unlocked">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VaultUnlockValues>({
    resolver: zodResolver(vaultUnlockSchema),
    defaultValues: { passphrase: "" },
  });

  const onSubmit = async (values: VaultUnlockValues) => {
    setServerError(null);
    try {
      setDialState("unlocking");
      await unlockVault(values.passphrase);
      setDialState("unlocked");
    } catch (err) {
      setDialState("idle");
      setServerError(
        err instanceof Error ? err.message : "Incorrect Vault Passphrase"
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-24">
            <VaultDial state={dialState} />
          </div>
        </div>

        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
            Vault locked
          </p>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Enter your Vault Passphrase
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your saved passwords stay encrypted until you unlock them.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            label="Vault Passphrase"
            htmlFor="unlock-passphrase"
            error={errors.passphrase?.message}
          >
            <PasswordInput
              id="unlock-passphrase"
              autoComplete="off"
              placeholder="Enter your passphrase"
              hasError={!!errors.passphrase}
              autoFocus
              {...register("passphrase")}
            />
          </FormField>

          {serverError && (
            <p
              className="rounded-lg border border-destructive/30 bg-state-danger-dim px-3.5 py-2.5 text-xs font-medium text-destructive"
              role="alert"
            >
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? "Unlocking…" : "Unlock vault"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setResetDialogOpen(true)}
          className="mt-6 w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Forgot your Vault Passphrase?
        </button>
      </motion.div>

      <ResetVaultDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>
  );
}
