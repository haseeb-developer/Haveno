import Link from "next/link";
import { ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-vault-gold/30 bg-accent">
        <ShieldQuestion className="h-6 w-6 text-vault-gold" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.home}>Back to safety</Link>
      </Button>
    </div>
  );
}
