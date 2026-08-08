import { ShieldCheck } from "lucide-react";
import { BRAND } from "@/constants/copy";
import { SignOutButton } from "@/components/layout/sign-out-button";

export function DashboardHeader({ email }: { email: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-vault-gold/30 bg-ink">
            <ShieldCheck className="h-4 w-4 text-vault-gold" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            {BRAND.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
