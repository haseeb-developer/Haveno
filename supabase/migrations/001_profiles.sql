-- =============================================================================
-- Haveno — 001_profiles.sql
-- =============================================================================
-- WHAT THIS DOES
-- Creates a `public.profiles` table that mirrors a few useful fields from
-- Supabase's built-in `auth.users` table (which you cannot query directly
-- from the client for security reasons). A trigger keeps it in sync
-- automatically whenever someone signs up.
--
-- WHEN TO RUN THIS
-- Once, right after you create your Supabase project — before you start
-- testing sign-up in the app. Run it from the Supabase Dashboard:
--   Project → SQL Editor → New query → paste this file → Run
--
-- WHY THIS EXISTS
-- Even though this phase doesn't build the password vault yet, most apps
-- eventually need a `profiles` table to attach app-specific data to a user
-- (display name, avatar, preferences, etc.) without touching Supabase's
-- internal auth schema. Creating it now costs nothing and saves a migration
-- later.
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can only ever read their own profile row.
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only ever update their own profile row.
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep `updated_at` current on every edit.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
