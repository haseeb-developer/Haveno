-- =============================================================================
-- Haveno — 003_vault_encryption_keys.sql
-- =============================================================================
-- WHAT THIS DOES
-- Creates `public.vault_encryption_keys`: one row per user, holding ONLY
-- encrypted key material. Nothing in this table is ever useful without the
-- user's Vault Passphrase, which never reaches this database in any form.
--
-- WHAT IS STORED HERE (all of it is either ciphertext or public parameters):
--   wrapped_dek   — the vault's Data-Encryption-Key, itself encrypted
--                   (AES-256-GCM) under a key derived from the passphrase.
--                   Without the passphrase this is random-looking noise.
--   wrap_iv       — the nonce used for that one wrap operation. Not secret,
--                   just needs to be unique per encryption.
--   kdf_salt      — random salt used when deriving a key from the
--                   passphrase (Argon2id). Salts are public by design; they
--                   exist to defeat rainbow-table attacks, not to be secret.
--   kdf_params    — Argon2id cost parameters (memory/iterations/parallelism)
--                   used for this user, stored so we can tune cost over
--                   time per-user without breaking existing accounts.
--   verifier /
--   verifier_iv   — a known constant, encrypted under the DEK. Used purely
--                   to confirm the entered passphrase was correct (if
--                   decrypting the verifier succeeds, it was) — WITHOUT the
--                   server ever seeing or checking the real passphrase.
--
-- WHAT IS NEVER STORED HERE, ANYWHERE, EVER:
--   - The Vault Passphrase itself.
--   - The derived Key-Encryption-Key (KEK).
--   - The raw Data-Encryption-Key (DEK).
--   - Any decrypted vault contents.
--
-- WHEN TO RUN THIS
-- Once, via Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Run this before 004_vault_items.sql.
-- =============================================================================

create table if not exists public.vault_encryption_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,

  wrapped_dek text not null check (char_length(wrapped_dek) between 1 and 512),
  wrap_iv text not null check (char_length(wrap_iv) between 1 and 64),

  kdf_salt text not null check (char_length(kdf_salt) between 1 and 128),
  kdf_algorithm text not null default 'argon2id'
    check (kdf_algorithm in ('argon2id')),
  kdf_params jsonb not null,

  verifier text not null check (char_length(verifier) between 1 and 512),
  verifier_iv text not null check (char_length(verifier_iv) between 1 and 64),

  encryption_version smallint not null default 1 check (encryption_version >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vault_encryption_keys is
  'Stores only encrypted vault key material. Every column is either ciphertext or a public KDF/crypto parameter. The Vault Passphrase and every raw key derived from it are never sent here and never stored anywhere.';

alter table public.vault_encryption_keys enable row level security;

-- A user may only ever see, create, replace, or delete their OWN key
-- record. There is no policy granting any access to any other row, and no
-- policy grants access to the `anon` role at all — only `authenticated`
-- users can reach this table, and only their own single row.

create policy "select own encryption key"
  on public.vault_encryption_keys for select
  to authenticated
  using (auth.uid() = user_id);

create policy "insert own encryption key"
  on public.vault_encryption_keys for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "update own encryption key"
  on public.vault_encryption_keys for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own encryption key"
  on public.vault_encryption_keys for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.handle_vault_key_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_vault_encryption_keys_updated on public.vault_encryption_keys;

create trigger on_vault_encryption_keys_updated
  before update on public.vault_encryption_keys
  for each row execute procedure public.handle_vault_key_updated_at();
