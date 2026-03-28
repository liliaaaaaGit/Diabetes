-- RLS (Row Level Security) setup
-- NOTE:
-- The app uses cookie-based sessions and filters by user_id in application code.
-- These example policies still use a fixed UUID; for production, align policies with your
-- auth model (e.g. Supabase Auth + auth.uid()) or service-role server access.

-- Example fixed user id (legacy demo policies below — update for your deployment)
 
  -- USERS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE users FROM PUBLIC;

  CREATE POLICY users_select_own
    ON users FOR SELECT
    USING (id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY users_insert_self
    ON users FOR INSERT
    WITH CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

  -- Auth-Prototyp: Für den Registration/Login-Flow müssen neue Nutzereinträge
  -- (mit zufälliger UUID) überhaupt eingefügt/gelesen werden.
  -- Später (bei echter Supabase Auth / JWT) kann man diese Policies wieder
  -- strikt auf den eingeloggten User umstellen.
  CREATE POLICY users_select_any
    ON users FOR SELECT
    USING (true);

  CREATE POLICY users_insert_any
    ON users FOR INSERT
    WITH CHECK (true);

  CREATE POLICY users_delete_any
    ON users FOR DELETE
    USING (true);

  -- ENTRIES (base)
  ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entries FROM PUBLIC;

  CREATE POLICY entries_select_own
    ON entries FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY entries_insert_own
    ON entries FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY entries_update_own
    ON entries FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY entries_delete_own
    ON entries FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  -- ENTRY_GLUCOSE
  ALTER TABLE entry_glucose ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entry_glucose FROM PUBLIC;

  CREATE POLICY entry_glucose_select_own
    ON entry_glucose FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_glucose.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_glucose_insert_own
    ON entry_glucose FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_glucose.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_glucose_update_own
    ON entry_glucose FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_glucose.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_glucose.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_glucose_delete_own
    ON entry_glucose FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_glucose.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- ENTRY_INSULIN
  ALTER TABLE entry_insulin ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entry_insulin FROM PUBLIC;

  CREATE POLICY entry_insulin_select_own
    ON entry_insulin FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_insulin.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_insulin_insert_own
    ON entry_insulin FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_insulin.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_insulin_update_own
    ON entry_insulin FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_insulin.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_insulin.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_insulin_delete_own
    ON entry_insulin FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_insulin.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- ENTRY_MEAL
  ALTER TABLE entry_meal ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entry_meal FROM PUBLIC;

  CREATE POLICY entry_meal_select_own
    ON entry_meal FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_meal.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_meal_insert_own
    ON entry_meal FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_meal.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_meal_update_own
    ON entry_meal FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_meal.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_meal.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_meal_delete_own
    ON entry_meal FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_meal.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- ENTRY_ACTIVITY
  ALTER TABLE entry_activity ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entry_activity FROM PUBLIC;

  CREATE POLICY entry_activity_select_own
    ON entry_activity FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_activity.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_activity_insert_own
    ON entry_activity FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_activity.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_activity_update_own
    ON entry_activity FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_activity.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_activity.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_activity_delete_own
    ON entry_activity FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_activity.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- ENTRY_MOOD
  ALTER TABLE entry_mood ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE entry_mood FROM PUBLIC;

  CREATE POLICY entry_mood_select_own
    ON entry_mood FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_mood.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_mood_insert_own
    ON entry_mood FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_mood.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_mood_update_own
    ON entry_mood FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_mood.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_mood.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY entry_mood_delete_own
    ON entry_mood FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM entries e
        WHERE e.id = entry_mood.entry_id
          AND e.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- CONVERSATIONS
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE conversations FROM PUBLIC;

  CREATE POLICY conversations_select_own
    ON conversations FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY conversations_insert_own
    ON conversations FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY conversations_update_own
    ON conversations FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  -- MESSAGES
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE messages FROM PUBLIC;

  CREATE POLICY messages_select_own
    ON messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND c.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY messages_insert_own
    ON messages FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND c.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  CREATE POLICY messages_delete_own
    ON messages FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND c.user_id = '00000000-0000-0000-0000-000000000001'::uuid
      )
    );

  -- INSIGHTS
  ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE insights FROM PUBLIC;

  CREATE POLICY insights_select_own
    ON insights FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY insights_insert_own
    ON insights FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY insights_update_own
    ON insights FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY insights_delete_own
    ON insights FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  -- GOALS
  ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON TABLE goals FROM PUBLIC;

  CREATE POLICY goals_select_own
    ON goals FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY goals_insert_own
    ON goals FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY goals_update_own
    ON goals FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

  CREATE POLICY goals_delete_own
    ON goals FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

 
