"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  fetchVaultItemRows,
  fetchVaultKeyRecord,
  persistVaultKeyRecord,
  insertVaultItemRow,
  updateVaultItemRow,
  deleteVaultItemRow,
} from "@/lib/supabase/vault";
import {
  decryptVaultItem,
  encryptVaultItem,
  setupVaultEncryption,
  unlockVault as unlockVaultCrypto,
  CURRENT_ENCRYPTION_VERSION,
  DEFAULT_AUTO_LOCK_MINUTES,
} from "@/lib/crypto";
import type {
  VaultItem,
  VaultItemInput,
  VaultLockStatus,
} from "@/types/vault";

interface VaultContextValue {
  status: VaultLockStatus;
  items: VaultItem[];
  isSyncing: boolean;
  autoLockMinutes: number;
  setAutoLockMinutes: (minutes: number) => void;
  setupVault: (passphrase: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<void>;
  lockVault: () => void;
  addItem: (input: VaultItemInput) => Promise<void>;
  updateItem: (id: string, input: VaultItemInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [status, setStatus] = useState<VaultLockStatus>("checking");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(DEFAULT_AUTO_LOCK_MINUTES);

  // The DEK lives only in this ref — never in state (avoids it flowing
  // through React DevTools serialization or re-render snapshots) and never
  // in localStorage/sessionStorage. Cleared to null on lock.
  const dekRef = useRef<CryptoKey | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockVault = useCallback(() => {
    dekRef.current = null;
    setItems([]);
    setStatus((prev) => (prev === "checking" ? prev : "locked"));
  }, []);

  // Determine initial status: does this user have a vault key record yet?
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const record = await fetchVaultKeyRecord();
        if (cancelled) return;
        setStatus(record ? "locked" : "needs-setup");
      } catch {
        if (!cancelled) setStatus("locked");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auto-lock on inactivity.
  useEffect(() => {
    if (status !== "unlocked") return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(
        () => lockVault(),
        autoLockMinutes * 60 * 1000
      );
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") resetTimer();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, autoLockMinutes, lockVault]);

  // Wipe on unmount as an extra safety net.
  useEffect(() => {
    return () => {
      dekRef.current = null;
    };
  }, []);

  const decryptAllRows = useCallback(async (dek: CryptoKey) => {
    const rows = await fetchVaultItemRows();
    const decrypted = await Promise.all(
      rows.map(async (row) => {
        const plaintext = await decryptVaultItem(row.encrypted_payload, row.iv, dek);
        return {
          ...plaintext,
          id: row.id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } satisfies VaultItem;
      })
    );
    return decrypted;
  }, []);

  const setupVaultFn = useCallback(
    async (passphrase: string) => {
      if (!user) throw new Error("Not authenticated");

      const { record, dek } = await setupVaultEncryption(passphrase);
      await persistVaultKeyRecord(user.id, record);

      dekRef.current = dek;
      setItems([]);
      setStatus("unlocked");
    },
    [user]
  );

  const unlockVaultFn = useCallback(
    async (passphrase: string) => {
      const record = await fetchVaultKeyRecord();
      if (!record) throw new Error("Vault has not been set up yet");

      const dek = await unlockVaultCrypto(passphrase, {
        wrappedDek: record.wrapped_dek,
        wrapIv: record.wrap_iv,
        kdfSalt: record.kdf_salt,
        kdfParams: record.kdf_params,
        verifier: record.verifier,
        verifierIv: record.verifier_iv,
      });

      dekRef.current = dek;
      setIsSyncing(true);
      try {
        const decrypted = await decryptAllRows(dek);
        setItems(decrypted);
        setStatus("unlocked");
      } finally {
        setIsSyncing(false);
      }
    },
    [decryptAllRows]
  );

  const requireDek = useCallback(() => {
    if (!dekRef.current) throw new Error("Vault is locked");
    return dekRef.current;
  }, []);

  const addItem = useCallback(
    async (input: VaultItemInput) => {
      if (!user) throw new Error("Not authenticated");
      const dek = requireDek();

      const plaintext = { ...input, isFavorite: input.isFavorite ?? false };
      const { encryptedPayload, iv } = await encryptVaultItem(plaintext, dek);

      const row = await insertVaultItemRow({
        userId: user.id,
        encryptedPayload,
        iv,
        encryptionVersion: CURRENT_ENCRYPTION_VERSION,
      });

      setItems((prev) => [
        {
          ...plaintext,
          id: row.id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        ...prev,
      ]);
    },
    [user, requireDek]
  );

  const updateItem = useCallback(
    async (id: string, input: VaultItemInput) => {
      const dek = requireDek();
      const plaintext = { ...input, isFavorite: input.isFavorite ?? false };
      const { encryptedPayload, iv } = await encryptVaultItem(plaintext, dek);

      const row = await updateVaultItemRow({
        id,
        encryptedPayload,
        iv,
        encryptionVersion: CURRENT_ENCRYPTION_VERSION,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...plaintext, id, createdAt: item.createdAt, updatedAt: row.updated_at }
            : item
        )
      );
    },
    [requireDek]
  );

  const deleteItem = useCallback(async (id: string) => {
    await deleteVaultItemRow(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const dek = requireDek();
      const current = items.find((item) => item.id === id);
      if (!current) return;

      const updatedPlaintext = { ...current, isFavorite: !current.isFavorite };
      const { encryptedPayload, iv } = await encryptVaultItem(updatedPlaintext, dek);

      const row = await updateVaultItemRow({
        id,
        encryptedPayload,
        iv,
        encryptionVersion: CURRENT_ENCRYPTION_VERSION,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...updatedPlaintext, updatedAt: row.updated_at }
            : item
        )
      );
    },
    [items, requireDek]
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      items,
      isSyncing,
      autoLockMinutes,
      setAutoLockMinutes,
      setupVault: setupVaultFn,
      unlockVault: unlockVaultFn,
      lockVault,
      addItem,
      updateItem,
      deleteItem,
      toggleFavorite,
    }),
    [
      status,
      items,
      isSyncing,
      autoLockMinutes,
      setupVaultFn,
      unlockVaultFn,
      lockVault,
      addItem,
      updateItem,
      deleteItem,
      toggleFavorite,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
