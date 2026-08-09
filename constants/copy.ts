export const BRAND = {
  name: "Havenoo",
  tagline: "One key. Everything protected.",
} as const;

export const AUTH_COPY = {
  login: {
    eyebrow: "Welcome back",
    title: "Unlock your vault",
    subtitle: "Enter your credentials to continue where you left off.",
    submit: "Unlock vault",
    submitLoading: "Verifying…",
  },
  signUp: {
    eyebrow: "Create an account",
    title: "Build your vault",
    subtitle: "Set up secure access in under a minute.",
    submit: "Create account",
    submitLoading: "Setting up…",
  },
  forgotPassword: {
    eyebrow: "Account recovery",
    title: "Reset your password",
    subtitle: "We'll send a secure link to your email address.",
    submit: "Send reset link",
    submitLoading: "Sending…",
  },
  resetPassword: {
    eyebrow: "Choose a new password",
    title: "Set a new password",
    subtitle: "Make it something only you would know.",
    submit: "Update password",
    submitLoading: "Updating…",
  },
  verifyEmail: {
    eyebrow: "Almost there",
    title: "Check your inbox",
    subtitle:
      "We sent a confirmation link to your email address. Open it to activate your vault.",
  },
} as const;
