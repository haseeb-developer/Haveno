import type { Session, User } from "@supabase/supabase-js";

export type AuthUser = User;
export type AuthSession = Session;

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
}

export type FormStatus = "idle" | "submitting" | "success" | "error";
