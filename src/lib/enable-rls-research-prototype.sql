-- Run this in Supabase SQL Editor.
-- Goal: Enable RLS on all application tables and block anon-key access by default.
--
-- Architecture note for this project:
-- - Server/API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- - Browser/client should never query Supabase directly.
-- - If anon key is used accidentally, RLS denies access because no policies are granted.

-- Optional helper functions for future request-scoped RLS (auth.uid()-less setups)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION set_user_context(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is ON everywhere
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_glucose ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_insulin ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_meal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entry_mood ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals ENABLE ROW LEVEL SECURITY;

-- Clean up legacy demo policies (fixed UUID etc.)
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_delete_own ON public.users;
DROP POLICY IF EXISTS users_select_any ON public.users;
DROP POLICY IF EXISTS users_insert_any ON public.users;
DROP POLICY IF EXISTS users_delete_any ON public.users;

DROP POLICY IF EXISTS entries_select_own ON public.entries;
DROP POLICY IF EXISTS entries_insert_own ON public.entries;
DROP POLICY IF EXISTS entries_update_own ON public.entries;
DROP POLICY IF EXISTS entries_delete_own ON public.entries;

DROP POLICY IF EXISTS entry_glucose_select_own ON public.entry_glucose;
DROP POLICY IF EXISTS entry_glucose_insert_own ON public.entry_glucose;
DROP POLICY IF EXISTS entry_glucose_update_own ON public.entry_glucose;
DROP POLICY IF EXISTS entry_glucose_delete_own ON public.entry_glucose;

DROP POLICY IF EXISTS entry_insulin_select_own ON public.entry_insulin;
DROP POLICY IF EXISTS entry_insulin_insert_own ON public.entry_insulin;
DROP POLICY IF EXISTS entry_insulin_update_own ON public.entry_insulin;
DROP POLICY IF EXISTS entry_insulin_delete_own ON public.entry_insulin;

DROP POLICY IF EXISTS entry_meal_select_own ON public.entry_meal;
DROP POLICY IF EXISTS entry_meal_insert_own ON public.entry_meal;
DROP POLICY IF EXISTS entry_meal_update_own ON public.entry_meal;
DROP POLICY IF EXISTS entry_meal_delete_own ON public.entry_meal;

DROP POLICY IF EXISTS entry_activity_select_own ON public.entry_activity;
DROP POLICY IF EXISTS entry_activity_insert_own ON public.entry_activity;
DROP POLICY IF EXISTS entry_activity_update_own ON public.entry_activity;
DROP POLICY IF EXISTS entry_activity_delete_own ON public.entry_activity;

DROP POLICY IF EXISTS entry_mood_select_own ON public.entry_mood;
DROP POLICY IF EXISTS entry_mood_insert_own ON public.entry_mood;
DROP POLICY IF EXISTS entry_mood_update_own ON public.entry_mood;
DROP POLICY IF EXISTS entry_mood_delete_own ON public.entry_mood;

DROP POLICY IF EXISTS conversations_select_own ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
DROP POLICY IF EXISTS conversations_delete_own ON public.conversations;

DROP POLICY IF EXISTS messages_select_own ON public.messages;
DROP POLICY IF EXISTS messages_insert_own ON public.messages;
DROP POLICY IF EXISTS messages_delete_own ON public.messages;

DROP POLICY IF EXISTS insights_select_own ON public.insights;
DROP POLICY IF EXISTS insights_all_own ON public.insights;
DROP POLICY IF EXISTS insights_insert_own ON public.insights;
DROP POLICY IF EXISTS insights_update_own ON public.insights;
DROP POLICY IF EXISTS insights_delete_own ON public.insights;

DROP POLICY IF EXISTS goals_select_own ON public.goals;
DROP POLICY IF EXISTS goals_all_own ON public.goals;
DROP POLICY IF EXISTS goals_insert_own ON public.goals;
DROP POLICY IF EXISTS goals_update_own ON public.goals;
DROP POLICY IF EXISTS goals_delete_own ON public.goals;

-- ---------------------------------------------------------------------------
-- RLS policies (requesting_user_id()-based)
-- ---------------------------------------------------------------------------

-- USERS
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  USING (id = requesting_user_id());

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  USING (id = requesting_user_id())
  WITH CHECK (id = requesting_user_id());

CREATE POLICY users_insert_self
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY users_delete_own
  ON public.users
  FOR DELETE
  USING (id = requesting_user_id());

-- CONVERSATIONS
CREATE POLICY conversations_select_own
  ON public.conversations
  FOR SELECT
  USING (user_id = requesting_user_id());

CREATE POLICY conversations_insert_own
  ON public.conversations
  FOR INSERT
  WITH CHECK (user_id = requesting_user_id());

CREATE POLICY conversations_update_own
  ON public.conversations
  FOR UPDATE
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

CREATE POLICY conversations_delete_own
  ON public.conversations
  FOR DELETE
  USING (user_id = requesting_user_id());

-- MESSAGES (scoped via conversations.user_id)
CREATE POLICY messages_select_own
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY messages_insert_own
  ON public.messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY messages_delete_own
  ON public.messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = requesting_user_id()
    )
  );

-- ENTRIES
CREATE POLICY entries_select_own
  ON public.entries
  FOR SELECT
  USING (user_id = requesting_user_id());

CREATE POLICY entries_insert_own
  ON public.entries
  FOR INSERT
  WITH CHECK (user_id = requesting_user_id());

CREATE POLICY entries_update_own
  ON public.entries
  FOR UPDATE
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

CREATE POLICY entries_delete_own
  ON public.entries
  FOR DELETE
  USING (user_id = requesting_user_id());

-- ENTRY SUB-TABLES (entry_id -> entries.id)
CREATE POLICY entry_glucose_select_own
  ON public.entry_glucose
  FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_glucose_insert_own
  ON public.entry_glucose
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_glucose_delete_own
  ON public.entry_glucose
  FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_insulin_select_own
  ON public.entry_insulin
  FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_insulin_insert_own
  ON public.entry_insulin
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_insulin_delete_own
  ON public.entry_insulin
  FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_meal_select_own
  ON public.entry_meal
  FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_meal_insert_own
  ON public.entry_meal
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_meal_delete_own
  ON public.entry_meal
  FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_mood_select_own
  ON public.entry_mood
  FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_mood_insert_own
  ON public.entry_mood
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_mood_delete_own
  ON public.entry_mood
  FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_activity_select_own
  ON public.entry_activity
  FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_activity_insert_own
  ON public.entry_activity
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

CREATE POLICY entry_activity_delete_own
  ON public.entry_activity
  FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM public.entries
      WHERE user_id = requesting_user_id()
    )
  );

-- GOALS
CREATE POLICY goals_select_own
  ON public.goals
  FOR SELECT
  USING (user_id = requesting_user_id());

CREATE POLICY goals_all_own
  ON public.goals
  FOR ALL
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

-- INSIGHTS
CREATE POLICY insights_select_own
  ON public.insights
  FOR SELECT
  USING (user_id = requesting_user_id());

CREATE POLICY insights_all_own
  ON public.insights
  FOR ALL
  USING (user_id = requesting_user_id())
  WITH CHECK (user_id = requesting_user_id());

-- Optional hardening: remove direct grants from anon/authenticated.
-- (Supabase may re-grant on migrations/extensions; rerun if needed.)
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.entries FROM anon, authenticated;
REVOKE ALL ON TABLE public.entry_glucose FROM anon, authenticated;
REVOKE ALL ON TABLE public.entry_insulin FROM anon, authenticated;
REVOKE ALL ON TABLE public.entry_meal FROM anon, authenticated;
REVOKE ALL ON TABLE public.entry_activity FROM anon, authenticated;
REVOKE ALL ON TABLE public.entry_mood FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversations FROM anon, authenticated;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;
REVOKE ALL ON TABLE public.insights FROM anon, authenticated;
REVOKE ALL ON TABLE public.goals FROM anon, authenticated;

-- Reminder:
-- With RLS enabled and no permissive policies for anon/authenticated, direct anon access is denied.
-- Server-side service role still works for API routes and DB layer.

