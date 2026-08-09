"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/components/providers/vault-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRM_PHRASE = "DELETE MY VAULT";

export function ResetVaultDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { resetVault } = useVault();
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const canConfirm = confirmText.trim() === CONFIRM_PHRASE;

  const handleReset = async () => {
    if (!canConfirm) return;
    setIsResetting(true);
    try {
      await resetVault();
      toast.success("Starting fresh", {
        description: "Create a new Vault Passphrase to begin a new vault.",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't reset your vault", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsResetting(false);
      setConfirmText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmText("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-state-danger-dim">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
          </div>
          <DialogTitle>Forgot your Vault Passphrase?</DialogTitle>
          <DialogDescription>
            This does not recover your existing vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Havenoo never has access to your Vault Passphrase, so there is no
            way to recover it — for you, or for us. Continuing here will:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <span className="font-medium text-foreground">
                Permanently delete
              </span>{" "}
              every password currently saved in your vault
            </li>
            <li>Let you create a brand new Vault Passphrase</li>
            <li>Start you with a completely empty vault</li>
          </ul>
          <p className="font-medium text-destructive">
            Your existing saved passwords cannot be recovered after this.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="reset-confirm"
            className="text-xs font-medium text-foreground"
          >
            Type <span className="font-mono">{CONFIRM_PHRASE}</span> to
            confirm
          </label>
          <Input
            id="reset-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm}
            isLoading={isResetting}
            onClick={handleReset}
          >
            Delete vault & start over
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
