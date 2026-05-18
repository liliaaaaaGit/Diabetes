-- Study evaluation questionnaire (one row per user, upsert on re-open)

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  language text NOT NULL DEFAULT 'de' CHECK (language IN ('de', 'en')),
  last_section text CHECK (last_section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),

  a1_age integer CHECK (a1_age IS NULL OR a1_age BETWEEN 0 AND 120),
  a2_diabetes_type text CHECK (a2_diabetes_type IS NULL OR a2_diabetes_type IN ('typ1', 'typ2', 'lada', 'andere', 'keine_angabe')),
  a3_years_with_diabetes integer CHECK (a3_years_with_diabetes IS NULL OR a3_years_with_diabetes BETWEEN 0 AND 100),
  a4_therapy_form text CHECK (a4_therapy_form IS NULL OR a4_therapy_form IN ('pen_ict', 'pumpe_csii', 'tabletten', 'nur_lebensstil', 'keine_angabe')),
  a5_current_tools_count text CHECK (a5_current_tools_count IS NULL OR a5_current_tools_count IN ('0', '1', '2', '3', '4_plus')),

  b1_supportive smallint CHECK (b1_supportive IS NULL OR b1_supportive BETWEEN -3 AND 3),
  b2_easy smallint CHECK (b2_easy IS NULL OR b2_easy BETWEEN -3 AND 3),
  b3_efficient smallint CHECK (b3_efficient IS NULL OR b3_efficient BETWEEN -3 AND 3),
  b4_clear smallint CHECK (b4_clear IS NULL OR b4_clear BETWEEN -3 AND 3),
  b5_exciting smallint CHECK (b5_exciting IS NULL OR b5_exciting BETWEEN -3 AND 3),
  b6_interesting smallint CHECK (b6_interesting IS NULL OR b6_interesting BETWEEN -3 AND 3),
  b7_inventive smallint CHECK (b7_inventive IS NULL OR b7_inventive BETWEEN -3 AND 3),
  b8_innovative smallint CHECK (b8_innovative IS NULL OR b8_innovative BETWEEN -3 AND 3),

  c9_consolidation_replace smallint CHECK (c9_consolidation_replace IS NULL OR c9_consolidation_replace BETWEEN 1 AND 5),
  c10_consolidation_oneapp smallint CHECK (c10_consolidation_oneapp IS NULL OR c10_consolidation_oneapp BETWEEN 1 AND 5),
  c11_consolidation_cgm smallint CHECK (c11_consolidation_cgm IS NULL OR c11_consolidation_cgm BETWEEN 1 AND 5),

  d12_buddy_empathy smallint CHECK (d12_buddy_empathy IS NULL OR d12_buddy_empathy BETWEEN 1 AND 5),
  d13_buddy_self_disclosure smallint CHECK (d13_buddy_self_disclosure IS NULL OR d13_buddy_self_disclosure BETWEEN 1 AND 5),
  d14_buddy_role_clarity smallint CHECK (d14_buddy_role_clarity IS NULL OR d14_buddy_role_clarity BETWEEN 1 AND 5),
  d15_buddy_transparency smallint CHECK (d15_buddy_transparency IS NULL OR d15_buddy_transparency BETWEEN 1 AND 5),
  d16_buddy_acceptance smallint CHECK (d16_buddy_acceptance IS NULL OR d16_buddy_acceptance BETWEEN 1 AND 5),

  e17_insight_correlation_aha smallint CHECK (e17_insight_correlation_aha IS NULL OR e17_insight_correlation_aha BETWEEN 1 AND 5),
  e18_insight_understandable smallint CHECK (e18_insight_understandable IS NULL OR e18_insight_understandable BETWEEN 1 AND 5),
  e19_self_awareness smallint CHECK (e19_self_awareness IS NULL OR e19_self_awareness BETWEEN 1 AND 5),
  e20_emotional_market_gap smallint CHECK (e20_emotional_market_gap IS NULL OR e20_emotional_market_gap BETWEEN 1 AND 5),
  e21_freetext_extraction_useful smallint CHECK (e21_freetext_extraction_useful IS NULL OR e21_freetext_extraction_useful BETWEEN 1 AND 5),

  f22_trust_data_clarity smallint CHECK (f22_trust_data_clarity IS NULL OR f22_trust_data_clarity BETWEEN 1 AND 5),
  f23_trust_overall smallint CHECK (f23_trust_overall IS NULL OR f23_trust_overall BETWEEN 1 AND 5),
  f24_privacy_text_clear smallint CHECK (f24_privacy_text_clear IS NULL OR f24_privacy_text_clear BETWEEN 1 AND 5),

  g25_intent_continue smallint CHECK (g25_intent_continue IS NULL OR g25_intent_continue BETWEEN 1 AND 5),
  g26_intent_recommend smallint CHECK (g26_intent_recommend IS NULL OR g26_intent_recommend BETWEEN 1 AND 5),

  h27_open_best text,
  h28_open_missed text,
  h29_open_one_change text,

  UNIQUE (user_id)
);

CREATE OR REPLACE FUNCTION update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS questionnaire_updated_at ON questionnaire_responses;
CREATE TRIGGER questionnaire_updated_at
  BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_questionnaire_updated_at();

ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own responses" ON questionnaire_responses;
CREATE POLICY "Users can read own responses"
  ON questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own responses" ON questionnaire_responses;
CREATE POLICY "Users can insert own responses"
  ON questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own responses" ON questionnaire_responses;
CREATE POLICY "Users can update own responses"
  ON questionnaire_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW questionnaire_analysis AS
SELECT
  r.id,
  r.user_id,
  r.created_at,
  r.completed_at,
  r.duration_seconds,
  r.language,
  r.a1_age,
  r.a2_diabetes_type,
  r.a3_years_with_diabetes,
  r.a4_therapy_form,
  r.a5_current_tools_count,
  ROUND(((r.b1_supportive + r.b2_easy + r.b3_efficient + r.b4_clear) / 4.0)::numeric, 2)
    AS ueq_pragmatic_quality,
  ROUND(((r.b5_exciting + r.b6_interesting + r.b7_inventive + r.b8_innovative) / 4.0)::numeric, 2)
    AS ueq_hedonic_quality,
  ROUND(((r.b1_supportive + r.b2_easy + r.b3_efficient + r.b4_clear
        + r.b5_exciting + r.b6_interesting + r.b7_inventive + r.b8_innovative) / 8.0)::numeric, 2)
    AS ueq_overall,
  ROUND(((r.c9_consolidation_replace + r.c10_consolidation_oneapp + r.c11_consolidation_cgm) / 3.0)::numeric, 2)
    AS mean_consolidation,
  ROUND(((r.d12_buddy_empathy + r.d13_buddy_self_disclosure + r.d14_buddy_role_clarity
        + r.d15_buddy_transparency + r.d16_buddy_acceptance) / 5.0)::numeric, 2)
    AS mean_buddy,
  ROUND(((r.e17_insight_correlation_aha + r.e18_insight_understandable + r.e19_self_awareness
        + r.e20_emotional_market_gap + r.e21_freetext_extraction_useful) / 5.0)::numeric, 2)
    AS mean_emotional_insight,
  ROUND(((r.f22_trust_data_clarity + r.f23_trust_overall + r.f24_privacy_text_clear) / 3.0)::numeric, 2)
    AS mean_trust,
  ROUND(((r.g25_intent_continue + r.g26_intent_recommend) / 2.0)::numeric, 2)
    AS mean_intent,
  r.b1_supportive,
  r.b2_easy,
  r.b3_efficient,
  r.b4_clear,
  r.b5_exciting,
  r.b6_interesting,
  r.b7_inventive,
  r.b8_innovative,
  r.c9_consolidation_replace,
  r.c10_consolidation_oneapp,
  r.c11_consolidation_cgm,
  r.d12_buddy_empathy,
  r.d13_buddy_self_disclosure,
  r.d14_buddy_role_clarity,
  r.d15_buddy_transparency,
  r.d16_buddy_acceptance,
  r.e17_insight_correlation_aha,
  r.e18_insight_understandable,
  r.e19_self_awareness,
  r.e20_emotional_market_gap,
  r.e21_freetext_extraction_useful,
  r.f22_trust_data_clarity,
  r.f23_trust_overall,
  r.f24_privacy_text_clear,
  r.g25_intent_continue,
  r.g26_intent_recommend,
  r.h27_open_best,
  r.h28_open_missed,
  r.h29_open_one_change
FROM questionnaire_responses r
WHERE r.completed_at IS NOT NULL;
