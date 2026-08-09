# Supabase configuration

This folder contains the SQL and configuration Havenoo's authentication
foundation relies on.

## Files

| File | Purpose | When to run |
|---|---|---|
| `migrations/001_profiles.sql` | Creates a `public.profiles` table synced to `auth.users`, with row-level security so users can only read/update their own row. | Once, right after creating your Supabase project. Run via **SQL Editor** in the dashboard. |
| `migrations/002_auth_settings.sql` | Not executable SQL — a checklist of dashboard settings (email confirmations, redirect URLs, templates) that can't be configured via SQL. | Read through once during setup. |

## How to run a migration

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Paste the contents of `001_profiles.sql`.
5. Click **Run**.

If you're using the [Supabase CLI](https://supabase.com/docs/guides/cli) with
local development, you can instead drop these files into your CLI project's
`supabase/migrations` folder and run `supabase db push`.

## Why row-level security matters

Every table in `public` is reachable by the anon key used in the browser.
Row-level security (RLS) policies are what actually stop one user from
reading or editing another user's data — the policies in `001_profiles.sql`
restrict every row to `auth.uid() = id`. Any table added in a future phase
(the password vault itself) must follow the same pattern.
