export type QuestionnaireSectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H"

export const QUESTIONNAIRE_SECTIONS: QuestionnaireSectionId[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
]

export type DiabetesTypeValue = "typ1" | "typ2" | "lada" | "andere" | "keine_angabe"
export type TherapyFormValue =
  | "pen_ict"
  | "pumpe_csii"
  | "tabletten"
  | "nur_lebensstil"
  | "keine_angabe"
export type ToolsCountValue = "0" | "1" | "2" | "3" | "4_plus"

export interface QuestionnaireResponse {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  language: "de" | "en"
  lastSection: QuestionnaireSectionId | null
  durationSeconds: number | null

  a1Age: number | null
  a2DiabetesType: DiabetesTypeValue | null
  a3YearsWithDiabetes: number | null
  a4TherapyForm: TherapyFormValue | null
  a5CurrentToolsCount: ToolsCountValue | null

  b1Supportive: number | null
  b2Easy: number | null
  b3Efficient: number | null
  b4Clear: number | null
  b5Exciting: number | null
  b6Interesting: number | null
  b7Inventive: number | null
  b8Innovative: number | null

  c9ConsolidationReplace: number | null
  c10ConsolidationOneapp: number | null
  c11ConsolidationCgm: number | null

  d12BuddyEmpathy: number | null
  d13BuddySelfDisclosure: number | null
  d14BuddyRoleClarity: number | null
  d15BuddyTransparency: number | null
  d16BuddyAcceptance: number | null

  e17InsightCorrelationAha: number | null
  e18InsightUnderstandable: number | null
  e19SelfAwareness: number | null
  e20EmotionalMarketGap: number | null
  e21FreetextExtractionUseful: number | null

  f22TrustDataClarity: number | null
  f23TrustOverall: number | null
  f24PrivacyTextClear: number | null

  g25IntentContinue: number | null
  g26IntentRecommend: number | null

  h27OpenBest: string | null
  h28OpenMissed: string | null
  h29OpenOneChange: string | null
}

export type QuestionnairePatch = Partial<
  Omit<
    QuestionnaireResponse,
    "id" | "userId" | "createdAt" | "updatedAt" | "completedAt" | "durationSeconds"
  >
>

/** 29 closed scale items (excludes open text H27–H29). */
export const CLOSED_ITEM_KEYS = [
  "a1Age",
  "a2DiabetesType",
  "a3YearsWithDiabetes",
  "a4TherapyForm",
  "a5CurrentToolsCount",
  "b1Supportive",
  "b2Easy",
  "b3Efficient",
  "b4Clear",
  "b5Exciting",
  "b6Interesting",
  "b7Inventive",
  "b8Innovative",
  "c9ConsolidationReplace",
  "c10ConsolidationOneapp",
  "c11ConsolidationCgm",
  "d12BuddyEmpathy",
  "d13BuddySelfDisclosure",
  "d14BuddyRoleClarity",
  "d15BuddyTransparency",
  "d16BuddyAcceptance",
  "e17InsightCorrelationAha",
  "e18InsightUnderstandable",
  "e19SelfAwareness",
  "e20EmotionalMarketGap",
  "e21FreetextExtractionUseful",
  "f22TrustDataClarity",
  "f23TrustOverall",
  "f24PrivacyTextClear",
  "g25IntentContinue",
  "g26IntentRecommend",
] as const

export function countAnsweredClosedItems(row: QuestionnaireResponse): number {
  let n = 0
  for (const key of CLOSED_ITEM_KEYS) {
    const v = row[key]
    if (v !== null && v !== undefined) n += 1
  }
  return n
}

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
