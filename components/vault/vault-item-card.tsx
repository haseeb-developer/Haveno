"use client";

import { useEffect, useRef, useState } from "react";
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

/** A single self-contained credential field. */
function CredentialField({
  label,
  value,
  glow,
  actions,
}: {
  label: string;
  value: string;
  glow?: boolean;
  actions: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
        "transition-colors duration-300",
        glow
          ? "border-vault-gold/25 bg-vault-gold/[0.05]"
          : "border-border/50 bg-accent/40"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/55">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate font-mono text-[12.5px] leading-none tracking-wide transition-colors duration-300",
            glow ? "text-vault-gold" : "text-foreground/90"
          )}
        >
          {value}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
    </div>
  );
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
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const favicon = faviconFor(item.url);

  // The card wrapper below animates with framer-motion's `layout`/`whileHover`,
  // which applies a CSS transform. A transformed ancestor becomes the
  // containing block for any `position: fixed` descendant, so a fixed overlay
  // placed inside it only ever covers the card — not the rest of the page.
  // A real document-level listener is what correctly closes the menu on any
  // outside click, regardless of where the card sits or how it's animated.
  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group/card relative"
    >
      {/* Gradient border shell — a 1px gradient ring wrapping the real card */}
      <div
        className={cn(
          "relative rounded-xl bg-gradient-to-br from-border via-border to-border p-px",
          "transition-all duration-500 ease-out",
          "group-hover/card:from-vault-gold/60 group-hover/card:via-vault-gold/15 group-hover/card:to-transparent"
        )}
      >
        <Card
          className={cn(
            "relative overflow-hidden rounded-[11px] border-0 bg-card p-4",
            "shadow-sm shadow-black/[0.03] transition-shadow duration-500",
            "group-hover/card:shadow-xl group-hover/card:shadow-black/[0.08] dark:group-hover/card:shadow-black/50"
          )}
        >
          {/* Identity row */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                "border border-border/60 bg-background shadow-sm",
                "transition-transform duration-300 ease-out group-hover/card:scale-105 group-hover/card:border-vault-gold/30"
              )}
            >
              {favicon ? (
                // Favicon service icon only — never anything decrypted.
                <Image
                  src={favicon}
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Globe className="h-4 w-4 text-vault-gold" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[14px] font-semibold leading-tight tracking-tight text-foreground">
                {item.name}
              </p>
              {item.category && (
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/70">
                  {item.category}
                </p>
              )}
            </div>

            <IconButton
              onClick={onToggleFavorite}
              active={item.isFavorite}
              aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={item.isFavorite}
              className="-mr-1 h-7 w-7 shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <motion.span
                animate={item.isFavorite ? { rotate: [0, -15, 15, 0] } : {}}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex"
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-200",
                    item.isFavorite
                      ? "fill-vault-gold text-vault-gold"
                      : "text-muted-foreground/50"
                  )}
                />
              </motion.span>
            </IconButton>
          </div>

          {/* Credential fields */}
          <div className="mt-3 space-y-1.5">
            {item.username && (
              <CredentialField
                label="Username"
                value={
                  usernameMasked
                    ? "•".repeat(Math.min(item.username.length, 16))
                    : item.username
                }
                actions={
                  <>
                    <IconButton
                      className="h-6 w-6 transition-transform duration-150 hover:scale-110 active:scale-95"
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
                      className="h-6 w-6 transition-transform duration-150 hover:scale-110 active:scale-95"
                      onClick={() =>
                        copy(item.username, `${item.id}-username`, "Username copied")
                      }
                      aria-label="Copy username"
                    >
                      <Copy
                        className={cn(
                          "h-3.5 w-3.5 transition-colors duration-150",
                          copiedKey === `${item.id}-username` && "text-state-success"
                        )}
                      />
                    </IconButton>
                  </>
                }
              />
            )}

            <CredentialField
              label="Password"
              value={isRevealed ? item.password : "••••••••••••"}
              glow={isRevealed}
              actions={
                <>
                  <IconButton
                    className="h-6 w-6 transition-transform duration-150 hover:scale-110 active:scale-95"
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
                    className="h-6 w-6 transition-transform duration-150 hover:scale-110 active:scale-95"
                    onClick={() =>
                      copy(item.password, `${item.id}-password`, "Password copied")
                    }
                    aria-label="Copy password"
                  >
                    <Copy
                      className={cn(
                        "h-3.5 w-3.5 transition-colors duration-150",
                        copiedKey === `${item.id}-password` && "text-state-success"
                      )}
                    />
                  </IconButton>
                </>
              }
            />
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[10.5px] text-muted-foreground/60">
                Updated {formatRelativeTime(item.updatedAt)}
              </span>
              {item.hint && (
                <button
                  onClick={() => setHintOpen(true)}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border/40 transition-all duration-150 hover:bg-vault-gold/15 hover:text-vault-gold hover:ring-vault-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
                  aria-label="View password hint"
                >
                  <KeyRound className="h-2.5 w-2.5" />
                  Hint
                </button>
              )}
            </div>

            <div ref={menuContainerRef} className="relative shrink-0">
              <IconButton
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="-mr-1 h-6.5 w-6.5 transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </IconButton>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-full right-0 z-20 mb-1.5 w-32 overflow-hidden rounded-lg border border-border bg-popover/95 p-1 shadow-xl shadow-black/10 backdrop-blur-md dark:shadow-black/40"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-destructive transition-colors duration-150 hover:bg-state-danger-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>

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