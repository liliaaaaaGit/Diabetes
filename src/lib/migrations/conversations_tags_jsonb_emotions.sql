-- Run in Supabase SQL Editor (once per project).
-- 1) Adds nullable jsonb `emotions` for per-conversation mood scores.
-- 2) If `tags` is still text[], converts it to jsonb so [{ "emoji", "label" }] can be stored.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS emotions jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'conversations'
      AND c.column_name = 'tags'
      AND c.data_type = 'ARRAY'
      AND c.udt_name = '_text'
  ) THEN
    ALTER TABLE public.conversations ALTER COLUMN tags DROP DEFAULT;
    ALTER TABLE public.conversations
      ALTER COLUMN tags TYPE jsonb USING (
        CASE
          WHEN tags IS NULL THEN '[]'::jsonb
          ELSE to_jsonb(tags)
        END
      );
    ALTER TABLE public.conversations ALTER COLUMN tags SET DEFAULT '[]'::jsonb;
  END IF;
END $$;
