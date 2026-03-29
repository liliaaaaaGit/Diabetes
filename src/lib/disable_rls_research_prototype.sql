-- Run this in Supabase: SQL Editor → New query → paste → Run.
--
-- Research prototype only: turns off Row Level Security on app tables so the
-- browser Supabase client (anon key) is no longer blocked by policies that
-- were tied to a fixed demo user UUID. The app still filters by user_id in code.
--
-- Security: Anyone with your anon key and project URL could read/write all rows
-- if they bypass your app. Do not use this pattern for production with real PHI.

ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_glucose DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_insulin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_meal DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_mood DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals DISABLE ROW LEVEL SECURITY;
