"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { acknowledgeTerms } from "@/lib/supabase/profile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/constants/copy";
import { TermsSecurityContent } from "@/components/terms/terms-security-content";

const schema = z.object({
  acknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge this before continuing" }),
  }),
});

type Values = { acknowledged: true };

export function TermsSecurityGate({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { acknowledged: undefined as unknown as true },
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await acknowledgeTerms(userId);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't save your acknowledgment", {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-73px)] max-w-2xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-vault-gold/30 bg-accent">
            <ShieldCheck className="h-5 w-5 text-vault-gold" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
            Before you begin
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Terms &amp; Security
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {BRAND.name} is built on zero-knowledge encryption. A few things
            are important to understand before you create your vault.
          </p>
        </div>

        <TermsSecurityContent />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-xl border border-vault-gold/25 bg-accent px-5 py-5"
        >
          <div className="flex items-start gap-3">
            <Controller
              name="acknowledged"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="terms-acknowledged"
                  className="mt-0.5"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label
              htmlFor="terms-acknowledged"
              className="cursor-pointer text-sm font-normal leading-relaxed text-foreground"
            >
              I understand that {BRAND.name} cannot recover my Vault
              Passphrase, and that forgetting it may permanently prevent
              access to my existing vault.
            </Label>
          </div>
          {errors.acknowledged && (
            <p className="text-xs font-medium text-destructive">
              {errors.acknowledged.message}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            {isSubmitting ? "Saving…" : "I understand, continue"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
