export type QuestionnaireSectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G"

export const QUESTIONNAIRE_SECTIONS: QuestionnaireSectionId[] = ["A", "B", "C", "D", "E", "F", "G"]

export function sectionIndex(section: QuestionnaireSectionId): number {
  return QUESTIONNAIRE_SECTIONS.indexOf(section)
}

export function nextSection(section: QuestionnaireSectionId): QuestionnaireSectionId | null {
  const i = sectionIndex(section)
  if (i < 0 || i >= QUESTIONNAIRE_SECTIONS.length - 1) return null
  return QUESTIONNAIRE_SECTIONS[i + 1]
}

export function prevSection(section: QuestionnaireSectionId): QuestionnaireSectionId | null {
  const i = sectionIndex(section)
  if (i <= 0) return null
  return QUESTIONNAIRE_SECTIONS[i - 1]
}

export type DiabetesTypeValue = "typ1" | "typ2" | "lada" | "andere" | "keine_angabe"
export type TherapyFormValue =
  | "pen_ict"
  | "pumpe_csii"
  | "tabletten"
  | "nur_lebensstil"
  | "keine_angabe"
export type ToolsCountValue = "0" | "1" | "2" | "3" | "4_plus"
export type AiUsageGeneralValue = "nie" | "selten" | "monatlich" | "woechentlich" | "taeglich"
export type AiUsageDiabetesValue = "ja_regelmaessig" | "ja_ausprobiert" | "nein"

export type SectionA = {
  age: number | null
  diabetes_type: DiabetesTypeValue | null
  years_with_diabetes: number | null
  therapy_form: TherapyFormValue | null
  tools_count: ToolsCountValue | null
  ai_usage_general: AiUsageGeneralValue | null
  ai_usage_diabetes: AiUsageDiabetesValue | null
}

export type SectionB = {
  s1: number | null
  s2: number | null
  s3: number | null
  s4: number | null
  s5: number | null
  s6: number | null
  s7: number | null
  s8: number | null
  s9: number | null
  s10: number | null
}

export type SectionC = {
  pu1: number | null
  pu2: number | null
  pu3: number | null
  pu4: number | null
  bi1: number | null
  bi2: number | null
  bi3: number | null
}

export type SectionD = {
  d1: number | null
  d2: number | null
  d3: number | null
  mc_role: number | null
  mc_transparency: number | null
}

export type SectionE = {
  e1: number | null
  e2: number | null
  e3: number | null
  e4: number | null
  e5: number | null
  e6: number | null
}

export type SectionF = {
  f1: number | null
  f2: number | null
  f3: number | null
}

export type SectionG = {
  g1: string | null
  g2: string | null
  g3: string | null
  /** Optional free-text field at the end of the questionnaire. */
  g4: string | null
}

export interface QuestionnaireResponse {
  id: string
  userId: string
  createdAt: string
  completedAt: string | null
  sectionA: SectionA
  sectionB: SectionB
  sectionC: SectionC
  sectionD: SectionD
  sectionE: SectionE
  sectionF: SectionF
  sectionG: SectionG
}

export type QuestionnairePatch = Partial<{
  sectionA: SectionA
  sectionB: SectionB
  sectionC: SectionC
  sectionD: SectionD
  sectionE: SectionE
  sectionF: SectionF
  sectionG: SectionG
}>

export const LIKERT_VALUES = [1, 2, 3, 4, 5] as const
