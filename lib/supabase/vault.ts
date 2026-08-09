import { createClient } from "@/lib/supabase/client";
import type { VaultEncryptionKeyRow, VaultItemRow } from "@/types/vault";
import type { VaultKeyRecord } from "@/lib/crypto/vault-crypto";

/**
 * Every function in this file only ever reads or writes ciphertext and
 * public crypto parameters. Nothing here ever sees a plaintext vault
 * value or the Vault Passphrase — encryption and decryption happen
 * exclusively in lib/crypto and the vault provider, never here.
 */

export async function fetchVaultKeyRecord(): Promise<VaultEncryptionKeyRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vault_encryption_keys")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as VaultEncryptionKeyRow | null;
}

export async function persistVaultKeyRecord(
  userId: string,
  record: VaultKeyRecord
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("vault_encryption_keys").insert({
    user_id: userId,
    wrapped_dek: record.wrappedDek,
    wrap_iv: record.wrapIv,
    kdf_salt: record.kdfSalt,
    kdf_algorithm: "argon2id",
    kdf_params: record.kdfParams,
    verifier: record.verifier,
    verifier_iv: record.verifierIv,
    encryption_version: record.encryptionVersion,
  });

  if (error) throw error;
}

export async function fetchVaultItemRows(): Promise<VaultItemRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vault_items")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VaultItemRow[];
}

export async function insertVaultItemRow(params: {
  userId: string;
  encryptedPayload: string;
  iv: string;
  encryptionVersion: number;
}): Promise<VaultItemRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vault_items")
    .insert({
      user_id: params.userId,
      encrypted_payload: params.encryptedPayload,
      iv: params.iv,
      encryption_version: params.encryptionVersion,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as VaultItemRow;
}

export async function updateVaultItemRow(params: {
  id: string;
  encryptedPayload: string;
  iv: string;
  encryptionVersion: number;
}): Promise<VaultItemRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vault_items")
    .update({
      encrypted_payload: params.encryptedPayload,
      iv: params.iv,
      encryption_version: params.encryptionVersion,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as VaultItemRow;
}

export async function deleteVaultItemRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Permanently discards a user's entire vault: every vault_items row and
 * the vault_encryption_keys row itself. There is deliberately no way to
 * recover what's deleted here — that's the whole point. This exists for
 * the "forgot my Vault Passphrase" flow, where the alternative would be a
 * recovery mechanism that breaks zero-knowledge encryption entirely.
 *
 * RLS on both tables already restricts every DELETE to auth.uid() =
 * user_id, so this can never touch another user's rows regardless of
 * what the client sends.
 */
export async function resetVaultCompletely(): Promise<void> {
  const supabase = createClient();

  const { error: itemsError } = await supabase
    .from("vault_items")
    .delete()
    .not("id", "is", null); // delete-all-own-rows guard; RLS scopes this to the caller

  if (itemsError) throw itemsError;

  const { error: keyError } = await supabase
    .from("vault_encryption_keys")
    .delete()
    .not("user_id", "is", null);

  if (keyError) throw keyError;
}
