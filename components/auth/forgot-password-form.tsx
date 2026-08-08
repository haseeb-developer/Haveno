"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { ROUTES } from "@/constants/routes";
import { AUTH_COPY } from "@/constants/copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/form-field";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const copy = AUTH_COPY.forgotPassword;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      values.email,
      { redirectTo: `${window.location.origin}${ROUTES.resetPassword}` }
    );

    if (error) {
      setServerError(error.message);
      toast.error("Couldn't send reset link", { description: error.message });
      return;
    }

    setSentTo(values.email);
    toast.success("Reset link sent");
  };

  return (
    <AnimatePresence mode="wait">
      {sentTo ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-state-success-dim">
            <MailCheck className="h-5 w-5 text-state-success" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              Check {sentTo}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Click the link in that email to choose a new password. It
              expires in 60 minutes.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hasError={!!errors.email}
              {...register("email")}
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

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting ? copy.submitLoading : copy.submit}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
