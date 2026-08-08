import { VAULT_PASSPHRASE_MIN_LENGTH } from "./constants";

export type PassphraseStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Strong" | "Excellent";
  meetsMinimum: boolean;
};

const SEQUENTIAL_PATTERNS = /(abcd|bcde|cdef|1234|2345|3456|4567|5678|6789|0123)/i;
const REPEATED_CHARS = /(.)\1{3,}/;

/**
 * Heuristic strength estimate for a Vault Passphrase. Deliberately
 * stricter in spirit than the account-password meter: this key protects
 * every saved credential at once, so length and unpredictability matter
 * more than satisfying character-class checkboxes.
 */
export function getPassphraseStrength(value: string): PassphraseStrength {
  const meetsMinimum = value.length >= VAULT_PASSPHRASE_MIN_LENGTH;

  if (!value) {
    return { score: 0, label: "Too short", meetsMinimum: false };
  }

  if (!meetsMinimum) {
    return { score: 0, label: "Too short", meetsMinimum: false };
  }

  let score = 1;

  if (value.length >= 16) score++;
  if (value.length >= 24) score++;

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (varietyCount >= 3) score++;

  const hasWordBoundaries = /[\s\-_.]/.test(value);
  if (hasWordBoundaries && value.length >= 20) score++;

  if (SEQUENTIAL_PATTERNS.test(value) || REPEATED_CHARS.test(value)) {
    score = Math.max(score - 2, 1);
  }

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: PassphraseStrength["label"][] = [
    "Too short",
    "Weak",
    "Fair",
    "Strong",
    "Excellent",
  ];

  return { score: clamped, label: labels[clamped]!, meetsMinimum };
}
