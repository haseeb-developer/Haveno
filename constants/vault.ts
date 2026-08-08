export const VAULT_LIMITS = {
  name: 100,
  username: 150,
  password: 256,
  hint: 100,
  url: 500,
  category: 50,
} as const;

export const DEFAULT_CATEGORIES = [
  "Personal",
  "Work",
  "Finance",
  "Social",
  "Shopping",
  "Entertainment",
  "Other",
] as const;
