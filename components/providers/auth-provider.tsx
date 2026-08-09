"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthSession, AuthState, AuthUser } from "@/types/auth";

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: AuthUser | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tracks the user id the server already rendered with (via initialUser),
  // so we only ask Server Components to re-render when the auth state
  // actually changes — not on every mount.
  const lastKnownUserId = useRef<string | null>(initialUser?.id ?? null);

  useEffect(() => {
    // onAuthStateChange fires once immediately on subscribe with an
    // INITIAL_SESSION event reporting whatever session already exists
    // (read locally from cookies — no network call). That's the only
    // "initial" check needed; there's no reason to also call
    // getSession() separately right after, since both would just report
    // the same thing a moment apart.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      // Only refresh Server Components when the signed-in identity
      // actually changed. INITIAL_SESSION just reports the state the
      // server already rendered with (root layout received the same user
      // via initialUser) — refreshing here would just re-fetch every
      // layout for no reason, on every single page load. TOKEN_REFRESHED
      // rotates the access token without changing who's signed in, so
      // Server Components don't need new data for that either.
      const newUserId = newSession?.user?.id ?? null;
      const identityChanged = newUserId !== lastKnownUserId.current;
      lastKnownUserId.current = newUserId;

      if (event !== "INITIAL_SESSION" && event !== "TOKEN_REFRESHED" && identityChanged) {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const value = useMemo(
    () => ({ user, session, isLoading, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, session, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
