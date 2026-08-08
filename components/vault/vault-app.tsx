"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useVault } from "@/components/providers/vault-provider";
import { VaultSetupScreen } from "@/components/vault/vault-setup-screen";
import { VaultUnlockScreen } from "@/components/vault/vault-unlock-screen";
import { VaultToolbar } from "@/components/vault/vault-toolbar";
import { VaultItemCard } from "@/components/vault/vault-item-card";
import { VaultEmptyState } from "@/components/vault/vault-empty-state";
import { VaultItemFormDialog } from "@/components/vault/vault-item-form-dialog";
import { DeleteItemDialog } from "@/components/vault/delete-item-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { VaultItem } from "@/types/vault";

function VaultLoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="mt-4 h-8 w-full rounded-lg" />
          <Skeleton className="mt-2.5 h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function VaultApp() {
  const { status, items, isSyncing, toggleFavorite } = useVault();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<VaultItem | null>(null);

  const filteredItems = useMemo(() => {
    // Search runs entirely against already-decrypted, in-memory items.
    // Supabase never sees the search term and never performs a plaintext
    // search of its own — it only ever stores ciphertext.
    const query = search.trim().toLowerCase();
    const base = query
      ? items.filter((item) =>
          [item.name, item.username, item.url, item.category]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : items;

    return [...base].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [items, search]);

  if (status === "checking") {
    return (
      <div className="mx-auto max-w-[1500px] px-6 py-12 lg:px-10">
        <VaultLoadingGrid />
      </div>
    );
  }

  if (status === "needs-setup") {
    return <VaultSetupScreen />;
  }

  if (status === "locked") {
    return <VaultUnlockScreen />;
  }

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 lg:px-10">
      <div className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-vault-gold">
          Vault
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Your saved passwords
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} · encrypted
          on your device
        </p>
      </div>

      <div className="mb-6">
        <VaultToolbar
          search={search}
          onSearchChange={setSearch}
          onAddNew={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        />
      </div>

      {isSyncing ? (
        <VaultLoadingGrid />
      ) : filteredItems.length === 0 ? (
        <VaultEmptyState
          isSearching={search.trim().length > 0}
          onAddNew={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setFormOpen(true);
                }}
                onDelete={() => setDeletingItem(item)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <VaultItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
      />

      <DeleteItemDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        item={deletingItem}
      />
    </main>
  );
}
