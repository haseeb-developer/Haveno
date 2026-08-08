-- =============================================================================
-- Haveno — 004_vault_items.sql
-- =============================================================================
-- WHAT THIS DOES
-- Creates `public.vault_items`, where every saved password entry lives.
--
-- Every sensitive field — website/app name, username, password, hint, URL,
-- category, AND favorite status — is combined into a single JSON object
-- and encrypted client-side (AES-256-GCM) BEFORE it ever reaches this
-- table. This database only ever stores the resulting ciphertext.
--
-- Only two columns are left as plain values, and neither reveals what a
-- vault item IS:
--   created_at / updated_at — needed to sort items without decrypting the
--     entire vault first. They reveal that *something* changed and when,
--     never what.
--
-- Even favorite status — which earlier zero-knowledge password managers
-- often leave in plaintext — is folded into the encrypted payload here, so
-- there is no plaintext user-related metadata at all beyond timestamps and
-- row ownership.
--
-- WHEN TO RUN THIS
-- Once, after 003_vault_encryption_keys.sql, via Supabase Dashboard →
-- SQL Editor → New query → paste → Run.
-- =============================================================================

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Single AES-256-GCM ciphertext blob of:
  -- { name, username, password, hint, url, category, isFavorite }
  -- Base64-encoded. Upper bound sized generously above what the combined
  -- character limits (100+150+256+100+500+50 chars + JSON overhead, then
  -- AES-GCM + base64 expansion) could ever produce, purely to block
  -- abusive oversized payloads — not a meaningful field-length signal.
  encrypted_payload text not null
    check (char_length(encrypted_payload) between 1 and 8000),

  -- Unique per-item nonce for the AES-GCM encryption above. Must never be
  -- reused with the same key — a fresh one is generated client-side for
  -- every single encrypt operation, including re-encryption on edit.
  iv text not null check (char_length(iv) between 1 and 64),

  -- Lets the client pick the right decrypt path if the encryption scheme
  -- is ever upgraded. Items get transparently re-encrypted to the current
  -- version during normal use — no bulk migration required.
  encryption_version smallint not null default 1 check (encryption_version >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vault_items is
  'Encrypted password vault entries. encrypted_payload contains every sensitive field, including favorite status, as a single AES-256-GCM ciphertext blob produced entirely client-side. This table never receives plaintext vault data.';

create index if not exists vault_items_user_id_idx on public.vault_items (user_id);
create index if not exists vault_items_user_updated_idx on public.vault_items (user_id, updated_at desc);

alter table public.vault_items enable row level security;

-- Ownership is enforced here, in Postgres — not in application code. This
-- holds even if a client sends a tampered `user_id` in a request body: the
-- USING/WITH CHECK clauses compare against auth.uid() from the verified
-- session JWT, not anything the client claims. No `anon` policies exist,
-- so unauthenticated requests are rejected outright.

create policy "select own vault items"
  on public.vault_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "insert own vault items"
  on public.vault_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "update own vault items"
  on public.vault_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own vault items"
  on public.vault_items for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.handle_vault_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_vault_items_updated on public.vault_items;

create trigger on_vault_items_updated
  before update on public.vault_items
  for each row execute procedure public.handle_vault_item_updated_at();
