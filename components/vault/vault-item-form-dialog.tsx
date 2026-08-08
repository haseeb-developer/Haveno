"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useVault } from "@/components/providers/vault-provider";
import { vaultItemSchema, type VaultItemValues } from "@/lib/validations/vault";
import { VAULT_LIMITS, DEFAULT_CATEGORIES } from "@/constants/vault";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VaultItem } from "@/types/vault";

export function VaultItemFormDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: VaultItem | null;
}) {
  const { addItem, updateItem } = useVault();
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VaultItemValues>({
    resolver: zodResolver(vaultItemSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      hint: "",
      url: "",
      category: "",
      isFavorite: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              name: item.name,
              username: item.username,
              password: item.password,
              hint: item.hint,
              url: item.url,
              category: item.category,
              isFavorite: item.isFavorite,
            }
          : {
              name: "",
              username: "",
              password: "",
              hint: "",
              url: "",
              category: "",
              isFavorite: false,
            }
      );
    }
  }, [open, item, reset]);

  const category = watch("category");

  const onSubmit = async (values: VaultItemValues) => {
    try {
      if (isEditing && item) {
        await updateItem(item.id, values);
        toast.success("Password updated");
      } else {
        await addItem(values);
        toast.success("Password saved");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't save this entry", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit password" : "Add password"}</DialogTitle>
          <DialogDescription>
            Everything here is encrypted on your device before it&apos;s saved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Website / App name" htmlFor="item-name" error={errors.name?.message}>
            <Input
              id="item-name"
              placeholder="e.g. GitHub"
              maxLength={VAULT_LIMITS.name}
              hasError={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Username / email" htmlFor="item-username" error={errors.username?.message}>
              <Input
                id="item-username"
                placeholder="you@example.com"
                maxLength={VAULT_LIMITS.username}
                hasError={!!errors.username}
                {...register("username")}
              />
            </FormField>

            <FormField label="Category" htmlFor="item-category" error={errors.category?.message}>
              <Select
                value={category}
                onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
              >
                <SelectTrigger id="item-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Password" htmlFor="item-password" error={errors.password?.message}>
            <PasswordInput
              id="item-password"
              placeholder="Enter or paste a password"
              maxLength={VAULT_LIMITS.password}
              hasError={!!errors.password}
              autoComplete="off"
              {...register("password")}
            />
          </FormField>

          <FormField
            label="Password hint (optional)"
            htmlFor="item-hint"
            error={errors.hint?.message}
          >
            <Input
              id="item-hint"
              placeholder="e.g. Old gaming account — never the password itself"
              maxLength={VAULT_LIMITS.hint}
              hasError={!!errors.hint}
              {...register("hint")}
            />
          </FormField>

          <FormField label="Website URL (optional)" htmlFor="item-url" error={errors.url?.message}>
            <Input
              id="item-url"
              placeholder="https://example.com"
              maxLength={VAULT_LIMITS.url}
              hasError={!!errors.url}
              {...register("url")}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? "Save changes" : "Save password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
