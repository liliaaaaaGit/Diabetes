-- DEPRECATED / INSECURE fallback.
--
-- Prefer enable-rls-research-prototype.sql instead.
-- That file enables RLS across all tables and blocks direct anon usage.
--
-- This file disables RLS and is only kept for emergency local debugging.
-- Do NOT run this on any environment with real participant data.

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
