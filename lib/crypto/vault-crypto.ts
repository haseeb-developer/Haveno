import {
  CURRENT_ENCRYPTION_VERSION,
  VAULT_VERIFIER_PLAINTEXT,
} from "./constants";
import { bytesToBase64, base64ToBytes, wipeBytes } from "./encoding";
import { deriveKek, generateKdfSalt, type KdfParams, DEFAULT_KDF_PARAMS } from "./kdf";
import { decryptString, encryptString, generateDek, unwrapDek, wrapDek } from "./aes";
import type { VaultItemPlaintext } from "@/types/vault";

export class InvalidPassphraseError extends Error {
  constructor() {
    super("Incorrect Vault Passphrase.");
    this.name = "InvalidPassphraseError";
  }
}

export interface VaultKeyRecord {
  wrappedDek: string;
  wrapIv: string;
  kdfSalt: string;
  kdfParams: KdfParams;
  verifier: string;
  verifierIv: string;
  encryptionVersion: number;
}

/**
 * Runs once, the first time a user sets up their vault. Generates a brand
 * new DEK, derives a KEK from their chosen passphrase, wraps the DEK
 * under it, and produces a verifier so future unlocks can confirm the
 * passphrase without ever sending it anywhere.
 *
 * Returns both the record to persist (all ciphertext/public parameters,
 * safe to send to Supabase) and the live, ready-to-use DEK for the
 * current session — so the vault is immediately usable without asking
 * the user to re-enter their passphrase right after they just set it.
 */
export async function setupVaultEncryption(passphrase: string): Promise<{
  record: VaultKeyRecord;
  dek: CryptoKey;
}> {
  const salt = generateKdfSalt();
  const kek = await deriveKek(passphrase, salt, DEFAULT_KDF_PARAMS);

  const extractableDek = await generateDek();
  const { wrappedDek, wrapIv } = await wrapDek(extractableDek, kek);

  // Re-import as non-extractable for actual session use — the extractable
  // reference above only existed transiently to produce the wrapped bytes.
  const rawDek = await crypto.subtle.exportKey("raw", extractableDek);
  const dek = await crypto.subtle.importKey(
    "raw",
    rawDek,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  wipeBytes(new Uint8Array(rawDek));

  const { ciphertext: verifier, iv: verifierIv } = await encryptString(
    VAULT_VERIFIER_PLAINTEXT,
    dek
  );

  return {
    record: {
      wrappedDek,
      wrapIv,
      kdfSalt: bytesToBase64(salt),
      kdfParams: DEFAULT_KDF_PARAMS,
      verifier,
      verifierIv,
      encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    },
    dek,
  };
}

/**
 * Runs every time the user unlocks their vault. Re-derives the KEK from
 * the entered passphrase (same salt and parameters as setup), unwraps the
 * DEK, and checks it against the stored verifier.
 *
 * Throws InvalidPassphraseError if the passphrase is wrong — this can
 * surface either as unwrapKey() failing GCM's authentication check, or as
 * the verifier decrypting to something unexpected, so both paths are
 * normalized into the same error.
 */
export async function unlockVault(
  passphrase: string,
  record: Pick<
    VaultKeyRecord,
    "wrappedDek" | "wrapIv" | "kdfSalt" | "kdfParams" | "verifier" | "verifierIv"
  >
): Promise<CryptoKey> {
  const saltBytes = base64ToBytes(record.kdfSalt);

  let kek: CryptoKey;
  let dek: CryptoKey;

  try {
    kek = await deriveKek(passphrase, saltBytes, record.kdfParams);
    dek = await unwrapDek(record.wrappedDek, record.wrapIv, kek);

    const verifierPlaintext = await decryptString(
      { ciphertext: record.verifier, iv: record.verifierIv },
      dek
    );

    if (verifierPlaintext !== VAULT_VERIFIER_PLAINTEXT) {
      throw new InvalidPassphraseError();
    }
  } catch {
    throw new InvalidPassphraseError();
  }

  return dek;
}

/** Encrypts a full vault item (all fields, including favorite status) as one blob. */
export async function encryptVaultItem(
  item: VaultItemPlaintext,
  dek: CryptoKey
): Promise<{ encryptedPayload: string; iv: string }> {
  const { ciphertext, iv } = await encryptString(JSON.stringify(item), dek);
  return { encryptedPayload: ciphertext, iv };
}

/** Decrypts a vault item payload back into its plaintext fields. */
export async function decryptVaultItem(
  encryptedPayload: string,
  iv: string,
  dek: CryptoKey
): Promise<VaultItemPlaintext> {
  const json = await decryptString({ ciphertext: encryptedPayload, iv }, dek);
  return JSON.parse(json) as VaultItemPlaintext;
}
