"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { useRevealTimeout } from "@/hooks/use-reveal-timeout";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { HintDialog } from "@/components/vault/hint-dialog";
import type { VaultItem } from "@/types/vault";

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function faviconFor(url: string) {
  if (!url) return null;
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(withProtocol).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export function VaultItemCard({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const { isRevealed, reveal, hide } = useRevealTimeout();
  const { copy, copiedKey } = useClipboard();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usernameMasked, setUsernameMasked] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const favicon = faviconFor(item.url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden p-5 transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-vault-gold/25 hover:shadow-lg hover:shadow-black/5",
          "dark:hover:shadow-black/30"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-accent">
              {favicon ? (
                // Favicon service icon only — never anything decrypted.
                <Image
                  src={favicon}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Globe className="h-4.5 w-4.5 text-vault-gold" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-foreground">
                {item.name}
              </p>
              {item.category && (
                <span className="mt-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
            <IconButton
              onClick={onToggleFavorite}
              active={item.isFavorite}
              aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={item.isFavorite}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  item.isFavorite && "fill-vault-gold"
                )}
              />
            </IconButton>
            <div className="relative">
              <IconButton
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreVertical className="h-4 w-4" />
              </IconButton>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
                    >
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-destructive transition-colors hover:bg-state-danger-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {item.username && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-accent/60 px-3 py-2 transition-colors group-hover:bg-accent">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-tabular">
                  {usernameMasked
                    ? "•".repeat(Math.min(item.username.length, 16))
                    : item.username}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton
                  className="h-6 w-6"
                  onClick={() => setUsernameMasked((v) => !v)}
                  aria-label={usernameMasked ? "Show username" : "Mask username"}
                >
                  {usernameMasked ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </IconButton>
                <IconButton
                  className="h-6 w-6"
                  onClick={() => copy(item.username, `${item.id}-username`, "Username copied")}
                  aria-label="Copy username"
                >
                  <Copy
                    className={cn(
                      "h-3.5 w-3.5",
                      copiedKey === `${item.id}-username` && "text-state-success"
                    )}
                  />
                </IconButton>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <span className="min-w-0 truncate font-mono text-xs tracking-wide text-foreground">
              {isRevealed ? item.password : "••••••••••••"}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton
                className="h-6 w-6"
                onClick={() => (isRevealed ? hide() : reveal())}
                aria-label={isRevealed ? "Hide password" : "Reveal password"}
              >
                {isRevealed ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </IconButton>
              <IconButton
                className="h-6 w-6"
                onClick={() => copy(item.password, `${item.id}-password`, "Password copied")}
                aria-label="Copy password"
              >
                <Copy
                  className={cn(
                    "h-3.5 w-3.5",
                    copiedKey === `${item.id}-password` && "text-state-success"
                  )}
                />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="text-[11px] text-muted-foreground">
            Updated {formatRelativeTime(item.updatedAt)}
          </span>
          {item.hint && (
            <button
              onClick={() => setHintOpen(true)}
              className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-vault-gold/15 hover:text-vault-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              aria-label="View password hint"
            >
              <KeyRound className="h-3 w-3" />
              Has hint
            </button>
          )}
        </div>
      </Card>

      {item.hint && (
        <HintDialog
          open={hintOpen}
          onOpenChange={setHintOpen}
          hint={item.hint}
          itemName={item.name}
        />
      )}
    </motion.div>
  );
}
