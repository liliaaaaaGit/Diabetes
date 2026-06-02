import { supabaseServer as supabase } from "@/lib/supabase-server"
import type {
  QuestionnairePatch,
  QuestionnaireResponse,
  SectionA,
  SectionB,
  SectionC,
  SectionD,
  SectionE,
  SectionF,
  SectionG,
} from "@/lib/questionnaire-types"

async function setQuestionnaireUserContext(userId: string): Promise<void> {
  const { error } = await supabase.rpc("set_requesting_user_id", { p_user_id: userId })
  if (error) throw error
}

const emptySectionA: SectionA = {
  age: null,
  diabetes_type: null,
  years_with_diabetes: null,
  therapy_form: null,
  tools_count: null,
  ai_usage_general: null,
  ai_usage_diabetes: null,
}

const emptySectionB: SectionB = {
  s1: null,
  s2: null,
  s3: null,
  s4: null,
  s5: null,
  s6: null,
  s7: null,
  s8: null,
  s9: null,
  s10: null,
}

const emptySectionC: SectionC = {
  pu1: null,
  pu2: null,
  pu3: null,
  pu4: null,
  bi1: null,
  bi2: null,
  bi3: null,
}

const emptySectionD: SectionD = {
  d1: null,
  d2: null,
  d3: null,
  mc_role: null,
  mc_transparency: null,
}

const emptySectionE: SectionE = {
  e1: null,
  e2: null,
  e3: null,
  e4: null,
  e5: null,
  e6: null,
}

const emptySectionF: SectionF = {
  f1: null,
  f2: null,
  f3: null,
}

const emptySectionG: SectionG = {
  g1: null,
  g2: null,
  g3: null,
}

function asObject<T extends object>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback
  return { ...fallback, ...(value as Partial<T>) }
}

function rowToResponse(row: Record<string, unknown>, userId: string): QuestionnaireResponse {
  return {
    id: String(row.id),
    userId,
    createdAt: String(row.created_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    sectionA: asObject(row.section_a, emptySectionA),
    sectionB: asObject(row.section_b, emptySectionB),
    sectionC: asObject(row.section_c, emptySectionC),
    sectionD: asObject(row.section_d, emptySectionD),
    sectionE: asObject(row.section_e, emptySectionE),
    sectionF: asObject(row.section_f, emptySectionF),
    sectionG: asObject(row.section_g, emptySectionG),
  }
}

function patchToDbRow(patch: QuestionnairePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (patch.sectionA) out.section_a = patch.sectionA
  if (patch.sectionB) out.section_b = patch.sectionB
  if (patch.sectionC) out.section_c = patch.sectionC
  if (patch.sectionD) out.section_d = patch.sectionD
  if (patch.sectionE) out.section_e = patch.sectionE
  if (patch.sectionF) out.section_f = patch.sectionF
  if (patch.sectionG) out.section_g = patch.sectionG
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
  await setQuestionnaireUserContext(userId)
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("id,user_id,created_at,completed_at,section_a,section_b,section_c,section_d,section_e,section_f,section_g")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) return null
    throw error
  }
  if (!data) return null
  return rowToResponse(data as Record<string, unknown>, userId)
}

export async function upsertQuestionnaireResponse(
  userId: string,
  patch: QuestionnairePatch
): Promise<QuestionnaireResponse> {
  await setQuestionnaireUserContext(userId)
  const dbPatch = patchToDbRow(patch)
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .upsert({ user_id: userId, ...dbPatch }, { onConflict: "user_id" })
    .select("id,user_id,created_at,completed_at,section_a,section_b,section_c,section_d,section_e,section_f,section_g")
    .single()

  if (error) throw error
  return rowToResponse(data as Record<string, unknown>, userId)
}

export async function completeQuestionnaireResponse(userId: string): Promise<QuestionnaireResponse> {
  await setQuestionnaireUserContext(userId)
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .upsert(
      {
        user_id: userId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id,user_id,created_at,completed_at,section_a,section_b,section_c,section_d,section_e,section_f,section_g")
    .single()

  if (error) throw error
  return rowToResponse(data as Record<string, unknown>, userId)
}

export async function getQuestionnaireAnalysisRows(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from("questionnaire_analysis").select("*")
  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}
