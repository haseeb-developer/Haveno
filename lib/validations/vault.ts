import { z } from "zod";
import { VAULT_PASSPHRASE_MIN_LENGTH } from "@/lib/crypto/constants";
import { VAULT_LIMITS } from "@/constants/vault";

export const vaultPassphraseSetupSchema = z
  .object({
    passphrase: z
      .string()
      .min(
        VAULT_PASSPHRASE_MIN_LENGTH,
        `Use at least ${VAULT_PASSPHRASE_MIN_LENGTH} characters`
      ),
    confirmPassphrase: z.string().min(1, "Confirm your Vault Passphrase"),
    acknowledged: z.literal(true, {
      errorMap: () => ({
        message: "You must acknowledge this before continuing",
      }),
    }),
  })
  .refine((data) => data.passphrase === data.confirmPassphrase, {
    message: "Passphrases don't match",
    path: ["confirmPassphrase"],
  });

export type VaultPassphraseSetupValues = z.infer<
  typeof vaultPassphraseSetupSchema
>;

export const vaultUnlockSchema = z.object({
  passphrase: z.string().min(1, "Enter your Vault Passphrase"),
});

export type VaultUnlockValues = z.infer<typeof vaultUnlockSchema>;

export const vaultItemSchema = z
  .object({
    name: z
      .string()
      .min(1, "Website or app name is required")
      .max(VAULT_LIMITS.name, `Maximum ${VAULT_LIMITS.name} characters`),
    username: z
      .string()
      .max(VAULT_LIMITS.username, `Maximum ${VAULT_LIMITS.username} characters`)
      .default(""),
    password: z
      .string()
      .min(1, "Password is required")
      .max(VAULT_LIMITS.password, `Maximum ${VAULT_LIMITS.password} characters`),
    hint: z
      .string()
      .max(VAULT_LIMITS.hint, `Maximum ${VAULT_LIMITS.hint} characters`)
      .default(""),
    url: z
      .string()
      .max(VAULT_LIMITS.url, `Maximum ${VAULT_LIMITS.url} characters`)
      .default(""),
    category: z
      .string()
      .max(VAULT_LIMITS.category, `Maximum ${VAULT_LIMITS.category} characters`)
      .default(""),
    isFavorite: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.hint) return;

    const hint = data.hint.trim().toLowerCase();
    const password = data.password.trim().toLowerCase();

    if (hint.length > 0 && password.length > 0) {
      if (hint === password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The hint can't be the same as the password",
          path: ["hint"],
        });
      } else if (hint.includes(password) && password.length >= 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The hint can't contain the actual password",
          path: ["hint"],
        });
      }
    }
  });

export type VaultItemValues = z.infer<typeof vaultItemSchema>;
