"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ShieldAlert, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/components/providers/vault-provider";
import {
  vaultPassphraseSetupSchema,
  type VaultPassphraseSetupValues,
} from "@/lib/validations/vault";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { PassphraseStrengthMeter } from "@/components/vault/passphrase-strength-meter";
import { VaultDial } from "@/components/auth/vault-dial";

export function VaultSetupScreen() {
  const { setupVault } = useVault();
  const [serverError, setServerError] = useState<string | null>(null);
  const [dialState, setDialState] = useState<"idle" | "unlocking" | "unlocked">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VaultPassphraseSetupValues>({
    resolver: zodResolver(vaultPassphraseSetupSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
      acknowledged: undefined as unknown as true,
    },
  });

  const passphrase = watch("passphrase");

  const onSubmit = async (values: VaultPassphraseSetupValues) => {
    setServerError(null);
    try {
      setDialState("unlocking");
      await setupVault(values.passphrase);
      setDialState("unlocked");
      toast.success("Vault created", {
        description: "Your vault is ready and unlocked for this session.",
      });
    } catch (err) {
      setDialState("idle");
      const message =
        err instanceof Error ? err.message : "Couldn't set up your vault";
      setServerError(message);
      toast.error("Setup failed", { description: message });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-28">
            <VaultDial state={dialState} />
          </div>
        </div>

        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
            One-time setup
          </p>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Create your Vault Passphrase
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is separate from your account password. It&apos;s the only key
            that can unlock your saved passwords — Haveno never sees it and
            can&apos;t recover it for you.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-vault-gold/25 bg-accent px-4 py-3.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-vault-gold" />
          <p className="text-xs leading-relaxed text-foreground">
            <span className="font-medium">
              Haveno cannot recover your Vault Passphrase.
            </span>{" "}
            If you lose it, your encrypted vault cannot be decrypted — by
            you, or by anyone else.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            label="Vault Passphrase"
            htmlFor="passphrase"
            error={errors.passphrase?.message}
          >
            <PasswordInput
              id="passphrase"
              autoComplete="new-password"
              placeholder="At least 12 characters"
              hasError={!!errors.passphrase}
              {...register("passphrase")}
            />
            <PassphraseStrengthMeter passphrase={passphrase ?? ""} />
          </FormField>

          <FormField
            label="Confirm Vault Passphrase"
            htmlFor="confirmPassphrase"
            error={errors.confirmPassphrase?.message}
          >
            <PasswordInput
              id="confirmPassphrase"
              autoComplete="new-password"
              placeholder="Re-enter your passphrase"
              hasError={!!errors.confirmPassphrase}
              {...register("confirmPassphrase")}
            />
          </FormField>

          <div className="flex items-start gap-2.5">
            <Controller
              name="acknowledged"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acknowledged"
                  className="mt-0.5"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label
              htmlFor="acknowledged"
              className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
            >
              I understand Haveno cannot recover my Vault Passphrase, and
              that losing it means losing access to my saved passwords.
            </Label>
          </div>
          {errors.acknowledged && (
            <p className="text-xs font-medium text-destructive">
              {errors.acknowledged.message}
            </p>
          )}

          {serverError && (
            <p
              className="rounded-lg border border-destructive/30 bg-state-danger-dim px-3.5 py-2.5 text-xs font-medium text-destructive"
              role="alert"
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            <KeyRound className="h-4 w-4" />
            {isSubmitting ? "Creating vault…" : "Create vault"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
