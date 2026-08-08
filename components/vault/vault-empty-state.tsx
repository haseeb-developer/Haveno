"use client";

import { motion } from "framer-motion";
import { SearchX, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VaultEmptyState({
  isSearching,
  onAddNew,
}: {
  isSearching: boolean;
  onAddNew: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
        {isSearching ? (
          <SearchX className="h-6 w-6 text-muted-foreground" />
        ) : (
          <ShieldPlus className="h-6 w-6 text-vault-gold" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isSearching ? "No matches found" : "Your vault is empty"}
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {isSearching
            ? "Try a different search term."
            : "Add your first password to get started."}
        </p>
      </div>
      {!isSearching && (
        <Button onClick={onAddNew} className="mt-1">
          Add your first password
        </Button>
      )}
    </motion.div>
  );
}
