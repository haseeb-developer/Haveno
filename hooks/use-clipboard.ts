"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { CLIPBOARD_CLEAR_TIMEOUT_MS } from "@/lib/crypto/constants";

export function useClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (value: string, key: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn't copy to clipboard");
      return;
    }

    setCopiedKey(key);
    toast.success(label, {
      description: "Clipboard will clear automatically.",
    });

    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(async () => {
      setCopiedKey((current) => (current === key ? null : current));
      try {
        // Best-effort: only clear the clipboard if it still holds what we
        // put there. Browsers don't universally support reading it back to
        // verify, so this can occasionally clear something the user copied
        // after — an acceptable trade-off for not leaving a password
        // sitting in the clipboard indefinitely.
        const current = await navigator.clipboard.readText().catch(() => null);
        if (current === value) {
          await navigator.clipboard.writeText("");
        }
      } catch {
        // Clipboard read/write can be blocked by browser permissions —
        // fail silently, this is a defense-in-depth nicety, not the
        // primary security boundary.
      }
    }, CLIPBOARD_CLEAR_TIMEOUT_MS);
  }, []);

  return { copy, copiedKey };
}
