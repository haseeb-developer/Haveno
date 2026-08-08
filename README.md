# Haveno

A zero-knowledge password manager. Every saved credential is encrypted on
your device before it ever reaches the server — Supabase, its dashboard,
and Haveno's own developers only ever see ciphertext.

---

## 1. Project overview

Haveno ships in two layers:

- **Authentication** — email/password sign up, login, password recovery,
  email verification, and session management, built on Supabase Auth.
- **Vault** — a true zero-knowledge password vault. A separate **Vault
  Passphrase** (never your account password, never sent to the server)
  derives an encryption key entirely in your browser via Argon2id. AES-256-GCM
  encrypts every saved item — including favorite status — before it's sent
  to Supabase. There is no server-side decryption path, by design.

If you lose your Vault Passphrase, your vault cannot be recovered by
anyone, including Haveno. This is a deliberate trade-off of true
zero-knowledge encryption, and the app warns you about it clearly before
you set your passphrase.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui-style primitives |
| Animation | Framer Motion |
| Auth & database | Supabase (Auth + Postgres, Row Level Security) |
| Client-side encryption | Argon2id (hash-wasm) + AES-256-GCM (Web Crypto API) |
| Forms | React Hook Form |
| Validation | Zod |
| Icons | Lucide |

---

## 3. Folder structure

```
Haveno/
├── app/
│   ├── (auth)/                # Public auth pages: login, sign-up, password reset, etc.
│   ├── auth/                   # callback + confirm route handlers
│   ├── dashboard/               # Protected — renders the vault itself
│   │   ├── layout.tsx            # Auth guard + VaultProvider
│   │   └── page.tsx               # <VaultApp />
│   └── layout.tsx, page.tsx, globals.css, etc.
├── components/
│   ├── auth/                    # Auth forms, password input, vault-dial art, auth shell
│   ├── vault/                    # Setup/unlock screens, item cards, add/edit dialog, toolbar
│   ├── layout/                   # Dashboard header, sign-out button
│   ├── providers/                 # Auth context, Vault context (lock state machine), theme
│   └── ui/                         # Button, Input, Dialog, Select, Card, etc.
├── lib/
│   ├── crypto/                     # The zero-knowledge encryption engine
│   │   ├── constants.ts             # Argon2id/AES parameters, versioning
│   │   ├── encoding.ts               # base64/UTF-8 helpers
│   │   ├── kdf.ts                     # Argon2id key derivation
│   │   ├── aes.ts                      # AES-256-GCM + key wrap/unwrap
│   │   ├── vault-crypto.ts              # High-level setup/unlock/encrypt/decrypt API
│   │   └── passphrase-strength.ts        # Vault Passphrase strength meter
│   ├── supabase/                   # client.ts, server.ts, middleware.ts, vault.ts (ciphertext-only CRUD)
│   └── validations/                 # Zod schemas for auth + vault forms
├── types/
│   ├── vault.ts                      # VaultItem, VaultItemPlaintext, lock status, etc.
│   └── database.ts                    # Hand-written Supabase row types
├── constants/
│   └── vault.ts                       # Field character limits, default categories
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql, 002_auth_settings.sql
│       ├── 003_vault_encryption_keys.sql
│       └── 004_vault_items.sql
├── middleware.ts
└── next.config.ts                       # Includes strict CSP + security headers
```

---

## 4. How the zero-knowledge vault works

**Two separate secrets:**

| Secret | Used for | Ever sent to Supabase? |
|---|---|---|
| Account Password | Signing in via Supabase Auth | Yes — that's normal, it's just a login credential |
| Vault Passphrase | Deriving the encryption key for your vault | **Never**, in any form |

**Envelope encryption:**

```
Vault Passphrase
      |  Argon2id (64 MiB memory, 3 iterations, 4-way parallelism -- per-user salt)
      v
   KEK (Key-Encryption-Key)   -- re-derived on every unlock, never stored
      |  wraps/unwraps
      v
   DEK (Data-Encryption-Key)  -- random 256-bit key, generated once
      |  AES-256-GCM, unique IV per item
      v
   Encrypted vault items (name, username, password, hint, URL, category, favorite -- all one ciphertext blob)
```

The DEK is unwrapped via the Web Crypto API's `unwrapKey()` directly into a
**non-extractable** `CryptoKey` — its raw bytes never exist in
JavaScript-readable memory at any point after unlock, even if a page
script were compromised.

**What Supabase stores:** ciphertext, IVs, salts, and KDF cost parameters
only. `supabase/migrations/003_vault_encryption_keys.sql` and
`004_vault_items.sql` document every column and why it's safe to store.

**Search:** runs entirely client-side, against already-decrypted in-memory
items. Supabase never receives a search term and never performs a
plaintext search of any kind.

**Auto-lock:** the vault locks automatically after 5/10/15 minutes of
inactivity (configurable), wiping the decrypted DEK and vault items from
memory. Unlocking again requires the Vault Passphrase.

**Security headers:** `next.config.ts` sets a strict Content-Security-Policy,
`X-Frame-Options: DENY`, and related headers — since the realistic attack
path against browser-based encryption is XSS or clickjacking, not breaking
AES-256-GCM itself.

---

## 5. Creating a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, name it, set a database password, pick a region.
3. Wait for provisioning to finish (~2 minutes).

## 6. Enabling authentication

Email/password auth is on by default. Go to **Authentication → Sign In /
Providers → Email** and enable "Confirm email."

## 7. Configuring email authentication (redirect URLs)

**Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` while developing
- **Redirect URLs**: `http://localhost:3000/auth/callback` and
  `http://localhost:3000/auth/confirm`, plus your production equivalents.

## 8. Where to find your Project URL

**Project Settings → API → Project URL.**

## 9. Where to find your Anon Key

Same page — **Project Settings → API → Project API keys → `anon` `public`**.

## 10. Where to place every environment variable

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 11. Installing dependencies

```bash
npm install
```

## 12. Running locally

1. Run all four SQL migrations in `supabase/migrations/`, **in order**
   (001 → 002 → 003 → 004), via Supabase Dashboard → SQL Editor.
2. Fill in `.env.local`.
3. `npm run dev`, then visit `http://localhost:3000`.
4. Sign up, verify your email, log in — then you'll be prompted to create
   your Vault Passphrase before you can use the vault.

## 13. Building for production

```bash
npm run build
npm run start
```

## 14. Deployment guide

Deploy to Vercel (or any Next.js 15-compatible host) with the same three
environment variables, then update Supabase's **Site URL** and **Redirect
URLs** to match your production domain.

---

## 15. Troubleshooting

**"Invalid login credentials" even though the password is right.**
Email confirmation is likely still pending — confirm the account first.

**Auth email links redirect to an error page.**
Check **Authentication → URL Configuration → Redirect URLs** includes both
`/auth/callback` and `/auth/confirm` for every domain you use.

**"Incorrect Vault Passphrase" even though you're sure it's right.**
Vault Passphrases are case-sensitive and have no recovery path by design —
double-check for typos, caps lock, or leading/trailing spaces. There is no
way for Haveno to verify or reset this for you.

**Vault items don't decrypt / show as garbled data.**
This should never happen under normal operation — GCM's authentication tag
means a wrong key fails loudly rather than returning corrupted plaintext.
If you see this, don't attempt to "fix" the ciphertext; it indicates the
row was tampered with or corrupted, and that item should be deleted and
re-added.

**Types complain about `Database` fields.**
`types/database.ts` is hand-written to match the SQL migrations exactly.
Regenerate with `npx supabase gen types typescript --project-id <id>` for
a fully generated version once your schema stabilizes — see the note at
the top of that file if you do.

---

## 16. Frequently asked questions

**Why two passwords instead of one?**
Your account password is transmitted to Supabase Auth to log in — that's
normal. If the same password also derived your encryption key, Supabase
would have handled the one secret capable of decrypting your vault, even
briefly, which breaks the zero-knowledge guarantee. A separate passphrase
that's never transmitted anywhere avoids that entirely.

**What if I forget my Vault Passphrase?**
There's no recovery. A "reset" option would necessarily require Haveno to
either store your key or a way to derive it — both defeat the purpose of
zero-knowledge encryption. This is stated clearly during setup for exactly
this reason.

**Can Haveno's developers see my saved passwords?**
No — not through the database, the Supabase dashboard, backups, or direct
SQL access. Every one of those surfaces only ever contains ciphertext.

**Is Argon2id overkill for a password manager?**
No — it's the same tier of cost parameters Bitwarden uses by default. The
realistic attack this defends against is an attacker with a stolen copy of
the database attempting to brute-force Vault Passphrases offline; Argon2id's
memory-hardness makes that expensive at scale, unlike faster hash-based KDFs.
