"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      isLoading={isSigningOut}
    >
      {!isSigningOut && <LogOut className="h-3.5 w-3.5" />}
      Sign out
    </Button>
  );
}
