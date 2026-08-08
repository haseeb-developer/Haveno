"use client";

import { useState } from "react";
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
import type { VaultItem } from "@/types/vault";

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VaultItem | null;
}) {
  const { deleteItem } = useVault();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await deleteItem(item.id);
      toast.success("Password deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error("Couldn't delete this entry", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this password?</DialogTitle>
          <DialogDescription>
            {item ? `"${item.name}" will be permanently deleted. This can't be undone.` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
