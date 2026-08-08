import { argon2id } from "hash-wasm";
import { ARGON2ID_PARAMS, KDF_SALT_BYTES } from "./constants";
import { randomBytes, wipeBytes } from "./encoding";

export interface KdfParams {
  memorySize: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
}

export const DEFAULT_KDF_PARAMS: KdfParams = { ...ARGON2ID_PARAMS };

/**
 * Generates a fresh random salt for a new user's Key-Encryption-Key
 * derivation. Salts aren't secret — they're stored alongside the wrapped
 * key — but each user needs their own so identical passphrases don't
 * produce identical keys, and so precomputed attack tables are useless.
 */
export function generateKdfSalt(): Uint8Array {
  return randomBytes(KDF_SALT_BYTES);
}

/**
 * Derives a 256-bit Key-Encryption-Key from the Vault Passphrase using
 * Argon2id. This is deliberately expensive (~0.5–1s, ~64 MiB of memory per
 * attempt) so that brute-forcing passphrases — the only real attack
 * surface against a database full of ciphertext — is slow and costly even
 * at scale.
 *
 * The returned bytes are raw key material. Callers must import them into
 * a non-extractable CryptoKey via importAndWipeKek() immediately and never
 * hold onto the raw bytes longer than that.
 */
export async function deriveKekBytes(
  passphrase: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS
): Promise<Uint8Array> {
  const derived = await argon2id({
    password: passphrase,
    salt,
    memorySize: params.memorySize,
    iterations: params.iterations,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    outputType: "binary",
  });

  return derived;
}

/**
 * Derives the KEK and immediately imports it as a non-extractable
 * AES-GCM CryptoKey, then wipes the raw derived bytes. From this point
 * forward the key material only exists inside the browser's crypto
 * subsystem — it cannot be exported, logged, or read back out via
 * JavaScript, even by code running on the page.
 */
export async function deriveKek(
  passphrase: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS
): Promise<CryptoKey> {
  const kekBytes = await deriveKekBytes(passphrase, salt, params);

  try {
    const kek = await crypto.subtle.importKey(
      "raw",
      kekBytes as BufferSource,
      { name: "AES-GCM" },
      false, // non-extractable — raw bytes can never be read back out
      ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    );
    return kek;
  } finally {
    wipeBytes(kekBytes);
  }
}
