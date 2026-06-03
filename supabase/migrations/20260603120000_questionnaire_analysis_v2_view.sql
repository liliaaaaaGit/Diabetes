-- Flatten questionnaire v2 JSON sections for CSV export / thesis analysis.
-- Requires section_a … section_g columns (migration 20260602100500_questionnaire_v2_sections.sql).
--
-- DROP required: PostgreSQL cannot rename view columns via CREATE OR REPLACE.

DROP VIEW IF EXISTS public.questionnaire_analysis;

CREATE VIEW public.questionnaire_analysis AS
SELECT
  r.id,
  r.user_id,
  r.created_at,
  r.completed_at,
  r.duration_seconds,
  r.language,

  -- Section A (background)
  (r.section_a->>'age')::integer AS a1_age,
  r.section_a->>'diabetes_type' AS a2_diabetes_type,
  (r.section_a->>'years_with_diabetes')::integer AS a3_years_with_diabetes,
  r.section_a->>'therapy_form' AS a4_therapy_form,
  r.section_a->>'tools_count' AS a5_tools_count,
  r.section_a->>'ai_usage_general' AS a6_ai_usage_general,
  r.section_a->>'ai_usage_diabetes' AS a7_ai_usage_diabetes,

  -- Section B (SUS)
  (r.section_b->>'s1')::smallint AS b1_sus,
  (r.section_b->>'s2')::smallint AS b2_sus,
  (r.section_b->>'s3')::smallint AS b3_sus,
  (r.section_b->>'s4')::smallint AS b4_sus,
  (r.section_b->>'s5')::smallint AS b5_sus,
  (r.section_b->>'s6')::smallint AS b6_sus,
  (r.section_b->>'s7')::smallint AS b7_sus,
  (r.section_b->>'s8')::smallint AS b8_sus,
  (r.section_b->>'s9')::smallint AS b9_sus,
  (r.section_b->>'s10')::smallint AS b10_sus,

  -- Section C (app consolidation)
  (r.section_c->>'pu1')::smallint AS c1_pu,
  (r.section_c->>'pu2')::smallint AS c2_pu,
  (r.section_c->>'pu3')::smallint AS c3_pu,
  (r.section_c->>'pu4')::smallint AS c4_pu,
  (r.section_c->>'bi1')::smallint AS c5_bi,
  (r.section_c->>'bi2')::smallint AS c6_bi,
  (r.section_c->>'bi3')::smallint AS c7_bi,

  -- Section D (Gluco)
  (r.section_d->>'d1')::smallint AS d1,
  (r.section_d->>'d2')::smallint AS d2,
  (r.section_d->>'d3')::smallint AS d3,
  (r.section_d->>'mc_role')::smallint AS d4_mc_role,
  (r.section_d->>'mc_transparency')::smallint AS d5_mc_transparency,

  -- Section E (mood & insights)
  (r.section_e->>'e1')::smallint AS e1,
  (r.section_e->>'e2')::smallint AS e2,
  (r.section_e->>'e3')::smallint AS e3,
  (r.section_e->>'e4')::smallint AS e4,
  (r.section_e->>'e5')::smallint AS e5,
  (r.section_e->>'e6')::smallint AS e6,

  -- Section F (trust)
  (r.section_f->>'f1')::smallint AS f1,
  (r.section_f->>'f2')::smallint AS f2,
  (r.section_f->>'f3')::smallint AS f3,

  -- Section G (open questions; g4 optional)
  r.section_g->>'g1' AS g1_open_best,
  r.section_g->>'g2' AS g2_open_missed,
  r.section_g->>'g3' AS g3_open_one_change,
  r.section_g->>'g4' AS g4_open_other,

  -- Raw JSON (optional for ad-hoc queries)
  r.section_a,
  r.section_b,
  r.section_c,
  r.section_d,
  r.section_e,
  r.section_f,
  r.section_g
FROM public.questionnaire_responses r
WHERE r.completed_at IS NOT NULL;
