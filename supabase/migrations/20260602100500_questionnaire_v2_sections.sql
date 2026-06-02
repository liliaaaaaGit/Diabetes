-- Questionnaire v2: move from item columns to section JSON payloads (A-G)

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.set_requesting_user_id(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', coalesce(p_user_id::text, ''), true);
END;
$$;

ALTER TABLE public.questionnaire_responses
  ADD COLUMN IF NOT EXISTS section_a jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_b jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_c jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_d jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_e jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_f jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_g jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.questionnaire_responses
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_a_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_b_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_c_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_d_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_e_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_f_is_object,
  DROP CONSTRAINT IF EXISTS questionnaire_responses_section_g_is_object;

ALTER TABLE public.questionnaire_responses
  ADD CONSTRAINT questionnaire_responses_section_a_is_object CHECK (jsonb_typeof(section_a) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_b_is_object CHECK (jsonb_typeof(section_b) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_c_is_object CHECK (jsonb_typeof(section_c) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_d_is_object CHECK (jsonb_typeof(section_d) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_e_is_object CHECK (jsonb_typeof(section_e) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_f_is_object CHECK (jsonb_typeof(section_f) = 'object'),
  ADD CONSTRAINT questionnaire_responses_section_g_is_object CHECK (jsonb_typeof(section_g) = 'object');

ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS questionnaire_responses_select_own ON public.questionnaire_responses;
DROP POLICY IF EXISTS questionnaire_responses_insert_own ON public.questionnaire_responses;
DROP POLICY IF EXISTS questionnaire_responses_update_own ON public.questionnaire_responses;

CREATE POLICY questionnaire_responses_select_own
  ON public.questionnaire_responses
  FOR SELECT
  USING (requesting_user_id() = user_id);

CREATE POLICY questionnaire_responses_insert_own
  ON public.questionnaire_responses
  FOR INSERT
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY questionnaire_responses_update_own
  ON public.questionnaire_responses
  FOR UPDATE
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);
