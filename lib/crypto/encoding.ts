/**
 * Small binary <-> base64 helpers. Kept separate from the crypto logic so
 * the encryption code stays focused on cryptographic operations, not
 * string wrangling.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function utf8ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value);
}

export function bytesToUtf8(bytes: ArrayBuffer | Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Best-effort overwrite of a Uint8Array's contents before it's discarded.
 * JavaScript gives no hard guarantee this prevents the original bytes from
 * lingering in memory (the engine may have copied them, GC timing isn't
 * controllable), but zeroing reduces the window a value spends sitting
 * around unnecessarily and costs nothing to do.
 */
export function wipeBytes(bytes: Uint8Array): void {
  bytes.fill(0);
}
