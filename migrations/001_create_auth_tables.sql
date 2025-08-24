-- Migration: create users, guides, tourists (for TourGuideHub)
-- Paste this into Supabase SQL editor or run via psql with a service role key.

-- 1) Create users table (app-level profile referencing auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null check (role in ('guide','tourist')),
  created_at timestamptz default now()
);

-- 2) Guides table
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bio text default '',
  languages text[] default '{}', -- array of language codes/names
  photos text[] default '{}',    -- array of storage URLs
  created_at timestamptz default now()
);

-- 3) Tourists table
create table if not exists public.tourists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bio text default '',
  languages text[] default '{}',
  photos text[] default '{}',
  created_at timestamptz default now()
);

-- RLS policy stubs (these are comments — adapt them to your needs).
-- Enable row level security if you plan to restrict reads/writes:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--
-- Example policy to allow inserts for authenticated users:
-- CREATE POLICY "insert_users_if_authenticated" ON public.users
--   FOR INSERT
--   WITH CHECK (auth.uid() = new.id);
--
-- Example policy to allow a user to read their own profile:
-- CREATE POLICY "select_own_profile" ON public.users
--   FOR SELECT
--   USING (auth.uid() = id);
--
-- For guides/tourists, you might add similar policies:
-- CREATE POLICY "insert_own_guides" ON public.guides
--   FOR INSERT
--   WITH CHECK (auth.uid() = new.user_id);
--
-- CREATE POLICY "select_guides_public" ON public.guides
--   FOR SELECT
--   USING (true); -- maybe you want guides to be publicly visible
--
-- IMPORTANT: These policy examples are *stubs*. Carefully adapt policies to your security model,
-- and test them. When using RLS, the client (anon/public) role must have appropriate policies
-- that allow the app to perform the intended operations.