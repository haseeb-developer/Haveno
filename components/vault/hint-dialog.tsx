"use client";

import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function HintDialog({
  open,
  onOpenChange,
  hint,
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hint: string;
  itemName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <KeyRound className="h-4.5 w-4.5 text-vault-gold" />
          </div>
          <DialogTitle>Password hint</DialogTitle>
          <DialogDescription>For {itemName}</DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border border-border bg-accent/50 px-4 py-3 text-sm leading-relaxed text-foreground">
          {hint}
        </p>

        <p className="text-xs text-muted-foreground">
          A reminder only — never your actual password.
        </p>
      </DialogContent>
    </Dialog>
  );
}
