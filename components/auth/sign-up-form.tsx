"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";
import { ROUTES } from "@/constants/routes";
import { AUTH_COPY } from "@/constants/copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";

export function SignUpForm() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const copy = AUTH_COPY.signUp;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (values: SignUpValues) => {
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${window.location.origin}${ROUTES.authConfirm}`,
      },
    });

    if (error) {
      setServerError(error.message);
      toast.error("Couldn't create your account", {
        description: error.message,
      });
      return;
    }

    toast.success("Account created", {
      description: "Check your inbox to verify your email address.",
    });
    router.push(ROUTES.verifyEmail);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Jordan Reyes"
          hasError={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>

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

      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          hasError={!!errors.password}
          {...register("password")}
        />
        <PasswordStrengthMeter password={password ?? ""} />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          hasError={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      {serverError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-destructive/30 bg-state-danger-dim px-3.5 py-2.5 text-xs font-medium text-destructive"
          role="alert"
        >
          {serverError}
        </motion.p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
      >
        {isSubmitting ? copy.submitLoading : copy.submit}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By continuing you agree to Haveno&apos;s Terms of Service and
        Privacy Policy.
      </p>
    </form>
  );
}
