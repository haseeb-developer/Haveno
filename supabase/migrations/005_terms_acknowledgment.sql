-- =============================================================================
-- Havenoo — 005_terms_acknowledgment.sql
-- =============================================================================
-- WHAT THIS DOES
-- Adds a single nullable column to the existing public.profiles table to
-- track whether a user has acknowledged Havenoo's Terms & Security
-- information (zero-knowledge architecture, no passphrase recovery, the
-- reset-vault behavior). This is purely a UX flag — not sensitive data —
-- so it lives as plaintext alongside the rest of profiles, the same way
-- full_name and email already do.
--
-- No new RLS policies are needed: the existing "Users can view their own
-- profile" and "Users can update their own profile" policies from
-- 001_profiles.sql already cover reading and writing this new column.
--
-- WHEN TO RUN THIS
-- Once, via Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run on a project that already has real user data — this only
-- adds a nullable column, it doesn't touch or drop anything existing.
-- =============================================================================

alter table public.profiles
  add column if not exists terms_acknowledged_at timestamptz;

comment on column public.profiles.terms_acknowledged_at is
  'When the user acknowledged the Terms & Security information (zero-knowledge architecture, no passphrase recovery). NULL means not yet acknowledged.';
