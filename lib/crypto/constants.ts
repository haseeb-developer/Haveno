/**
 * All cryptographic parameters for Haveno's zero-knowledge vault live
 * here, in one place, so they're easy to audit and to bump in the future
 * without hunting through the codebase.
 */

/**
 * Argon2id cost parameters. These match the tier reputable password
 * managers (Bitwarden's default KDF settings) use for deriving an
 * encryption key from a user-chosen passphrase — deliberately expensive
 * enough that guessing passphrases at scale (e.g. against a leaked
 * database) is computationally and financially costly, while still
 * completing in roughly half a second to a second on typical hardware.
 *
 * memorySize is in KiB. 65536 KiB = 64 MiB per guess — the memory-hardness
 * is what makes GPU/ASIC brute-forcing impractical, since each parallel
 * guess needs its own 64 MiB, unlike simple hash-based KDFs which are
 * cheap to parallelize in hardware.
 */
export const ARGON2ID_PARAMS = {
  memorySize: 65536, // 64 MiB
  iterations: 3,
  parallelism: 4,
  hashLength: 32, // 256-bit derived key
} as const;

/** AES-256-GCM: authenticated encryption — tampering is detected, not just confidentiality. */
export const AES_KEY_LENGTH = 256;
export const AES_IV_BYTES = 12; // 96-bit nonce, the standard/recommended size for GCM
export const AES_ALGORITHM = "AES-GCM";

/** Length, in bytes, of the random per-user salt used for Argon2id. */
export const KDF_SALT_BYTES = 16;

/**
 * A fixed known plaintext, encrypted under the DEK and stored as the
 * `verifier`. On unlock, if this decrypts back to this exact string, the
 * entered passphrase was correct — checked entirely client-side, without
 * the server ever seeing or validating the passphrase itself.
 */
export const VAULT_VERIFIER_PLAINTEXT = "Haveno-verifier-v1";

/** Bumped whenever the encryption scheme changes, so old items keep decrypting correctly. */
export const CURRENT_ENCRYPTION_VERSION = 1;

/** Minimum Vault Passphrase length, enforced client-side before setup. */
export const VAULT_PASSPHRASE_MIN_LENGTH = 12;

/** Auto-lock inactivity timeout options, in minutes. */
export const AUTO_LOCK_OPTIONS_MINUTES = [1, 5, 10, 15] as const;
export const DEFAULT_AUTO_LOCK_MINUTES = 10;

/** How long a revealed password stays visible before auto-hiding, in ms. */
export const REVEAL_TIMEOUT_MS = 12_000;

/** How long copied clipboard content is cleared after, in ms, where supported. */
export const CLIPBOARD_CLEAR_TIMEOUT_MS = 20_000;
