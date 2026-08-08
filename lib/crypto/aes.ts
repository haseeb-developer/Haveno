import { AES_IV_BYTES } from "./constants";
import { base64ToBytes, bytesToBase64, randomBytes, utf8ToBytes, bytesToUtf8 } from "./encoding";

export interface EncryptedBlob {
  ciphertext: string; // base64
  iv: string; // base64
}

/**
 * Generates a new random 256-bit Data-Encryption-Key. This is the key
 * that actually encrypts vault items. It's generated once per user and
 * never changes — only its "wrapping" (the passphrase-derived encryption
 * protecting it) changes if the user updates their Vault Passphrase later.
 *
 * The key is created extractable=true ONLY because wrapKey() requires
 * that to produce the wrapped bytes below. It is never used in this form
 * for anything else, and the caller should discard this reference after
 * wrapping in favor of the non-extractable version returned by
 * unwrapDek().
 */
export async function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "wrapKey",
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Wraps (encrypts) the DEK under the KEK. The result — ciphertext plus the
 * IV used — is the ONLY form of the DEK that ever gets sent to Supabase.
 * Unwrapping requires the KEK, which in turn requires the Vault
 * Passphrase, which never leaves the browser.
 */
export async function wrapDek(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<{ wrappedDek: string; wrapIv: string }> {
  const iv = randomBytes(AES_IV_BYTES);

  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, {
    name: "AES-GCM",
    iv,
  });

  return {
    wrappedDek: bytesToBase64(new Uint8Array(wrapped)),
    wrapIv: bytesToBase64(iv),
  };
}

/**
 * Unwraps the DEK using the KEK, producing a non-extractable CryptoKey.
 * This is the key security property of the whole design: the raw DEK
 * bytes are never materialized in JavaScript-accessible memory at any
 * point during unlock. crypto.subtle.unwrapKey() decrypts the wrapped key
 * and hands back a live key handle entirely inside the browser's crypto
 * implementation — there is no API to read the raw bytes back out of a
 * non-extractable key, even from a compromised page.
 *
 * Throws if the passphrase (and therefore the KEK) was wrong — GCM's
 * built-in authentication tag makes unwrapping fail loudly rather than
 * silently returning garbage key material.
 */
export async function unwrapDek(
  wrappedDekB64: string,
  wrapIvB64: string,
  kek: CryptoKey
): Promise<CryptoKey> {
  const wrapped = base64ToBytes(wrappedDekB64);
  const iv = base64ToBytes(wrapIvB64);

  return crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    kek,
    { name: "AES-GCM", iv },
    { name: "AES-GCM" },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a UTF-8 string under the given key with a fresh random IV.
 * Used for both vault item payloads and the passphrase verifier.
 */
export async function encryptString(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedBlob> {
  const iv = randomBytes(AES_IV_BYTES);
  const plaintextBytes = utf8ToBytes(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

/**
 * Decrypts a blob produced by encryptString(). Throws if the key is
 * wrong or the ciphertext was tampered with — GCM authentication catches
 * both cases rather than returning corrupted plaintext.
 */
export async function decryptString(
  blob: EncryptedBlob,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToBytes(blob.ciphertext);
  const iv = base64ToBytes(blob.iv);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return bytesToUtf8(plaintext);
}
