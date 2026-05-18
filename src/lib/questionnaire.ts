import { supabaseServer as supabase } from "@/lib/supabase-server"
import type {
  QuestionnairePatch,
  QuestionnaireResponse,
  QuestionnaireSectionId,
} from "@/lib/questionnaire-types"

function rowToResponse(row: Record<string, unknown>): QuestionnaireResponse {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    language: row.language === "en" ? "en" : "de",
    lastSection: (row.last_section as QuestionnaireSectionId | null) ?? null,
    durationSeconds:
      row.duration_seconds != null ? Number(row.duration_seconds) : null,

    a1Age: row.a1_age != null ? Number(row.a1_age) : null,
    a2DiabetesType: (row.a2_diabetes_type as QuestionnaireResponse["a2DiabetesType"]) ?? null,
    a3YearsWithDiabetes:
      row.a3_years_with_diabetes != null ? Number(row.a3_years_with_diabetes) : null,
    a4TherapyForm: (row.a4_therapy_form as QuestionnaireResponse["a4TherapyForm"]) ?? null,
    a5CurrentToolsCount:
      (row.a5_current_tools_count as QuestionnaireResponse["a5CurrentToolsCount"]) ?? null,

    b1Supportive: row.b1_supportive != null ? Number(row.b1_supportive) : null,
    b2Easy: row.b2_easy != null ? Number(row.b2_easy) : null,
    b3Efficient: row.b3_efficient != null ? Number(row.b3_efficient) : null,
    b4Clear: row.b4_clear != null ? Number(row.b4_clear) : null,
    b5Exciting: row.b5_exciting != null ? Number(row.b5_exciting) : null,
    b6Interesting: row.b6_interesting != null ? Number(row.b6_interesting) : null,
    b7Inventive: row.b7_inventive != null ? Number(row.b7_inventive) : null,
    b8Innovative: row.b8_innovative != null ? Number(row.b8_innovative) : null,

    c9ConsolidationReplace:
      row.c9_consolidation_replace != null ? Number(row.c9_consolidation_replace) : null,
    c10ConsolidationOneapp:
      row.c10_consolidation_oneapp != null ? Number(row.c10_consolidation_oneapp) : null,
    c11ConsolidationCgm:
      row.c11_consolidation_cgm != null ? Number(row.c11_consolidation_cgm) : null,

    d12BuddyEmpathy: row.d12_buddy_empathy != null ? Number(row.d12_buddy_empathy) : null,
    d13BuddySelfDisclosure:
      row.d13_buddy_self_disclosure != null ? Number(row.d13_buddy_self_disclosure) : null,
    d14BuddyRoleClarity:
      row.d14_buddy_role_clarity != null ? Number(row.d14_buddy_role_clarity) : null,
    d15BuddyTransparency:
      row.d15_buddy_transparency != null ? Number(row.d15_buddy_transparency) : null,
    d16BuddyAcceptance:
      row.d16_buddy_acceptance != null ? Number(row.d16_buddy_acceptance) : null,

    e17InsightCorrelationAha:
      row.e17_insight_correlation_aha != null ? Number(row.e17_insight_correlation_aha) : null,
    e18InsightUnderstandable:
      row.e18_insight_understandable != null ? Number(row.e18_insight_understandable) : null,
    e19SelfAwareness: row.e19_self_awareness != null ? Number(row.e19_self_awareness) : null,
    e20EmotionalMarketGap:
      row.e20_emotional_market_gap != null ? Number(row.e20_emotional_market_gap) : null,
    e21FreetextExtractionUseful:
      row.e21_freetext_extraction_useful != null
        ? Number(row.e21_freetext_extraction_useful)
        : null,

    f22TrustDataClarity:
      row.f22_trust_data_clarity != null ? Number(row.f22_trust_data_clarity) : null,
    f23TrustOverall: row.f23_trust_overall != null ? Number(row.f23_trust_overall) : null,
    f24PrivacyTextClear:
      row.f24_privacy_text_clear != null ? Number(row.f24_privacy_text_clear) : null,

    g25IntentContinue: row.g25_intent_continue != null ? Number(row.g25_intent_continue) : null,
    g26IntentRecommend:
      row.g26_intent_recommend != null ? Number(row.g26_intent_recommend) : null,

    h27OpenBest: row.h27_open_best != null ? String(row.h27_open_best) : null,
    h28OpenMissed: row.h28_open_missed != null ? String(row.h28_open_missed) : null,
    h29OpenOneChange: row.h29_open_one_change != null ? String(row.h29_open_one_change) : null,
  }
}

function patchToDbRow(patch: QuestionnairePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const map: Record<string, string> = {
    language: "language",
    lastSection: "last_section",
    a1Age: "a1_age",
    a2DiabetesType: "a2_diabetes_type",
    a3YearsWithDiabetes: "a3_years_with_diabetes",
    a4TherapyForm: "a4_therapy_form",
    a5CurrentToolsCount: "a5_current_tools_count",
    b1Supportive: "b1_supportive",
    b2Easy: "b2_easy",
    b3Efficient: "b3_efficient",
    b4Clear: "b4_clear",
    b5Exciting: "b5_exciting",
    b6Interesting: "b6_interesting",
    b7Inventive: "b7_inventive",
    b8Innovative: "b8_innovative",
    c9ConsolidationReplace: "c9_consolidation_replace",
    c10ConsolidationOneapp: "c10_consolidation_oneapp",
    c11ConsolidationCgm: "c11_consolidation_cgm",
    d12BuddyEmpathy: "d12_buddy_empathy",
    d13BuddySelfDisclosure: "d13_buddy_self_disclosure",
    d14BuddyRoleClarity: "d14_buddy_role_clarity",
    d15BuddyTransparency: "d15_buddy_transparency",
    d16BuddyAcceptance: "d16_buddy_acceptance",
    e17InsightCorrelationAha: "e17_insight_correlation_aha",
    e18InsightUnderstandable: "e18_insight_understandable",
    e19SelfAwareness: "e19_self_awareness",
    e20EmotionalMarketGap: "e20_emotional_market_gap",
    e21FreetextExtractionUseful: "e21_freetext_extraction_useful",
    f22TrustDataClarity: "f22_trust_data_clarity",
    f23TrustOverall: "f23_trust_overall",
    f24PrivacyTextClear: "f24_privacy_text_clear",
    g25IntentContinue: "g25_intent_continue",
    g26IntentRecommend: "g26_intent_recommend",
    h27OpenBest: "h27_open_best",
    h28OpenMissed: "h28_open_missed",
    h29OpenOneChange: "h29_open_one_change",
  }

  for (const [camel, snake] of Object.entries(map)) {
    if (camel in patch) {
      out[snake] = (patch as Record<string, unknown>)[camel]
    }
  }
  return out
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = error.code ?? ""
  const msg = (error.message ?? "").toLowerCase()
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("questionnaire_responses") ||
    msg.includes("does not exist")
  )
}

export async function getQuestionnaireResponse(
  userId: string
): Promise<QuestionnaireResponse | null> {
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) return null
    throw error
  }
  if (!data) return null
  return rowToResponse(data as Record<string, unknown>)
}

export async function upsertQuestionnaireResponse(
  userId: string,
  patch: QuestionnairePatch
): Promise<QuestionnaireResponse> {
  const existing = await getQuestionnaireResponse(userId)
  const dbPatch = patchToDbRow(patch)

  if (existing) {
    const { data, error } = await supabase
      .from("questionnaire_responses")
      .update(dbPatch)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) throw error
    return rowToResponse(data as Record<string, unknown>)
  }

  const { data, error } = await supabase
    .from("questionnaire_responses")
    .insert({ user_id: userId, ...dbPatch })
    .select("*")
    .single()

  if (error) throw error
  return rowToResponse(data as Record<string, unknown>)
}

export async function completeQuestionnaireResponse(userId: string): Promise<QuestionnaireResponse> {
  const existing = await getQuestionnaireResponse(userId)
  const now = new Date()
  const createdAt = existing?.createdAt ? new Date(existing.createdAt) : now
  const durationSeconds = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 1000))

  const { data, error } = await supabase
    .from("questionnaire_responses")
    .upsert(
      {
        user_id: userId,
        completed_at: now.toISOString(),
        duration_seconds: durationSeconds,
        last_section: "H",
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single()

  if (error) throw error
  return rowToResponse(data as Record<string, unknown>)
}

export async function getQuestionnaireAnalysisRows(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from("questionnaire_analysis").select("*")
  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}
