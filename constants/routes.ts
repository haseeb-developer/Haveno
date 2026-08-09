export const ROUTES = {
  home: "/",
  login: "/login",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  dashboard: "/dashboard",
  termsSecurity: "/terms-security",
  authCallback: "/auth/callback",
  authConfirm: "/auth/confirm",
} as const;

export const PUBLIC_ROUTES: string[] = [
  ROUTES.login,
  ROUTES.signUp,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.verifyEmail,
  ROUTES.authCallback,
  ROUTES.authConfirm,
];

export const AUTH_ONLY_ROUTES: string[] = [
  ROUTES.login,
  ROUTES.signUp,
  ROUTES.forgotPassword,
];
