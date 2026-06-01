/**
 * Two-track crisis classification for the Gluco chatbot.
 *
 * The app must distinguish between two very different situations that can look
 * similar in casual language:
 *
 *  - Track A — MEDICAL emergency (hypo / hyperglycemia). Diabetes language like
 *    "bin fast gestorben" or "hab mir was gespritzt" describes a physical event,
 *    NOT a psychological crisis. These must never route the user to a suicide
 *    hotline.
 *  - Track B — PSYCHOLOGICAL crisis (suicidality, self-harm, hopelessness).
 *    Only this track should surface the Telefonseelsorge crisis resources.
 *
 * This module is intentionally framework-agnostic so it can be shared between
 * the client chat hook (to decide whether to show the crisis banner) and the
 * server chat route (to add context to the AI system prompt).
 */

/**
 * Medical (hypo/hyper) vocabulary. Already normalized (lowercase, no diacritics)
 * so we can match against normalized input. Keep phrases that clearly describe a
 * physical diabetes event rather than emotional distress.
 */
export const MEDICAL_KEYWORDS: string[] = [
  "fast gestorben",
  "hypo",
  "unterzucker",
  "unterzuckert",
  "uberzucker",
  "hyper",
  "gespritzt",
  "zucker im keller",
  "zucker so tief",
  "kann nicht mehr stehen",
  "konnte nicht mehr stehen",
  "zittere",
  "zittern",
  "alles schwarz",
  "schwarz vor augen",
  "krankenwagen",
  "notarzt",
  "bewusstlos",
  "ohnmacht",
  "ketoazidose",
  "keto",
  "uber 400",
  "uber 500",
  "blutzucker",
  // English
  "low blood sugar",
  "passed out",
  "unconscious",
  "ketoacidosis",
  "ambulance",
]

/**
 * Psychological-crisis vocabulary. These are deliberately specific so that
 * ambiguous medical phrases (e.g. "kann nicht mehr stehen") do NOT match here.
 * Already normalized (lowercase, no diacritics).
 */
export const PSYCH_KEYWORDS: string[] = [
  "will nicht mehr leben",
  "nicht mehr leben",
  "mochte nicht mehr leben", // möchte -> mochte after diacritic strip
  "leben beenden",
  "alles beenden",
  "suizid",
  "selbstmord",
  "umbringen",
  "selbstverletzung",
  "selbst verletzen",
  "ritzen",
  "mir wehtun",
  "mir weh tun",
  "hoffnungslos",
  "keinen sinn mehr",
  "keinen sinn im leben",
  "keinen ausweg",
  "zur last fallen",
  "niemandem mehr zur last",
  "nicht mehr aufwachen",
  "tot sein",
  // English
  "want to die",
  "dont want to live",
  "do not want to live",
  "kill myself",
  "suicide",
  "self harm",
  "selfharm",
  "self-harm",
  "end it all",
  "no reason to live",
  "hopeless",
]

/** Lowercase + strip diacritics so "über"/"uber" and casing don't matter. */
export function normalizeCrisisText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

export interface CrisisClassification {
  /** A physical diabetes emergency (hypo/hyper) is described. */
  medical: boolean
  /** Psychological distress / suicidality / self-harm is described. */
  psych: boolean
}

/**
 * Classify a single message into the two tracks. A message can match both
 * (e.g. someone in psychological distress also mentioning a hypo); callers
 * decide how to handle the overlap. Crucially, medical-only text never sets
 * `psych`, so it can never trigger the psychological crisis banner.
 */
export function classifyCrisisText(text: string): CrisisClassification {
  const normalized = normalizeCrisisText(text || "")
  const medical = MEDICAL_KEYWORDS.some((k) => normalized.includes(k))
  const psych = PSYCH_KEYWORDS.some((k) => normalized.includes(k))
  return { medical, psych }
}

/** Convenience: true only for the psychological track (Track B). */
export function isPsychologicalCrisis(text: string): boolean {
  return classifyCrisisText(text).psych
}
