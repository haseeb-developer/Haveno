import { PASSPHRASE_WORDLIST } from "./wordlist";
import { randomBytes } from "./encoding";

const DEFAULT_WORD_COUNT = 5;

/**
 * Picks a uniformly random index in [0, max) using the Web Crypto API's
 * cryptographically secure random source, with rejection sampling to
 * avoid modulo bias (a plain `randomByte % max` skews toward smaller
 * values whenever `max` doesn't evenly divide the random range).
 *
 * Pulls as many bytes as are actually needed to cover `max` — a single
 * byte only covers values 0–255, so for any `max` above 256 (Havenoo's
 * wordlist is 274 words) a fixed 1-byte version can never produce a
 * valid sample and loops forever.
 */
function secureRandomIndex(max: number): number {
  if (max <= 0) {
    throw new Error("secureRandomIndex: max must be a positive integer");
  }

  const bytesNeeded = Math.max(1, Math.ceil(Math.log2(max) / 8));
  const range = 256 ** bytesNeeded;
  const maxValid = Math.floor(range / max) * max;

  let value: number;
  do {
    const bytes = randomBytes(bytesNeeded);
    value = bytes.reduce((total, byte, i) => total + byte * 256 ** i, 0);
  } while (value >= maxValid);

  return value % max;
}

/**
 * Generates a passphrase entirely on-device from a fixed local wordlist,
 * using crypto.getRandomValues() under the hood — nothing here is sent
 * anywhere, logged, or derived from anything network-dependent.
 *
 * With Havenoo's 274-word list, 5 words gives roughly 40 bits of entropy
 * (log2(274) * 5 ≈ 40.6) — comfortably past the 12-character minimum and
 * far stronger than a typical human-chosen password, while staying easy
 * to actually read and type. Users can regenerate as many times as they
 * like before committing to one.
 */
export function generatePassphrase(wordCount: number = DEFAULT_WORD_COUNT): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const index = secureRandomIndex(PASSPHRASE_WORDLIST.length);
    words.push(PASSPHRASE_WORDLIST[index]!);
  }
  return words.join("-");
}