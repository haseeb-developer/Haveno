"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { ROUTES } from "@/constants/routes";
import { AUTH_COPY } from "@/constants/copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const copy = AUTH_COPY.login;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      const message =
        error.message === "Invalid login credentials"
          ? "That email and password don't match our records."
          : error.message;
      setServerError(message);
      toast.error("Couldn't sign you in", { description: message });
      return;
    }

    toast.success("Welcome back");
    const redirectTo = searchParams.get("redirectTo") || ROUTES.dashboard;
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          hasError={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="rememberMe" {...register("rememberMe")} defaultChecked />
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer text-xs font-normal text-muted-foreground"
          >
            Keep me signed in
          </Label>
        </div>
        <Link
          href={ROUTES.forgotPassword}
          className="text-xs font-medium text-vault-gold transition-colors hover:text-vault-gold-bright"
        >
          Forgot password?
        </Link>
      </div>

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

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        {isSubmitting ? copy.submitLoading : copy.submit}
      </Button>
    </form>
  );
}
