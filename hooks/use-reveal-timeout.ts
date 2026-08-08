"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REVEAL_TIMEOUT_MS } from "@/lib/crypto/constants";

/**
 * Tracks whether a single sensitive value is currently revealed, and
 * automatically hides it again after a short timeout — so a decrypted
 * password doesn't stay visible on screen (or in the DOM) longer than
 * necessary, even if the user forgets to hide it manually.
 */
export function useRevealTimeout(timeoutMs: number = REVEAL_TIMEOUT_MS) {
  const [isRevealed, setIsRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const reveal = useCallback(() => {
    clear();
    setIsRevealed(true);
    timer.current = setTimeout(() => setIsRevealed(false), timeoutMs);
  }, [clear, timeoutMs]);

  const hide = useCallback(() => {
    clear();
    setIsRevealed(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { isRevealed, reveal, hide };
}
