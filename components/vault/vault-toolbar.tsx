"use client";

import { Lock, Plus, Search } from "lucide-react";
import { useVault } from "@/components/providers/vault-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTO_LOCK_OPTIONS_MINUTES } from "@/lib/crypto/constants";

export function VaultToolbar({
  search,
  onSearchChange,
  onAddNew,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAddNew: () => void;
}) {
  const { lockVault, autoLockMinutes, setAutoLockMinutes } = useVault();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your vault…"
          className="pl-10"
          aria-label="Search vault items"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={String(autoLockMinutes)}
          onValueChange={(value) => setAutoLockMinutes(Number(value))}
        >
          <SelectTrigger className="w-[150px]" aria-label="Auto-lock timeout">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTO_LOCK_OPTIONS_MINUTES.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                Lock after {minutes}m
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="default" onClick={lockVault}>
          <Lock className="h-4 w-4" />
          Lock
        </Button>

        <Button onClick={onAddNew}>
          <Plus className="h-4 w-4" />
          Add password
        </Button>
      </div>
    </div>
  );
}
