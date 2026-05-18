import type { MoodValue } from "@/lib/types"

/** i18n keys for mood scale 1 (worst) → 5 (best). */
export const MOOD_LABEL_KEYS: Record<MoodValue, string> = {
  1: "logbook.moodWorst",
  2: "logbook.moodNotGood",
  3: "logbook.moodNeutral",
  4: "logbook.moodGood",
  5: "logbook.moodGreat",
}

/** Legacy German note text stored before i18n labels → scale value. */
const LEGACY_NOTE_TO_VALUE: Record<string, MoodValue> = {
  "sehr schlecht": 1,
  schlecht: 1,
  "eher schlecht": 2,
  "nicht gut": 2,
  "geht so": 3,
  "ganz okay": 3,
  neutral: 3,
  mittel: 3,
  gut: 4,
  "ganz gut": 4,
  "sehr gut": 5,
  "sehr gut!": 5,
}

const GENERIC_NOTE_KEYS = new Set(
  Object.keys(LEGACY_NOTE_TO_VALUE).concat([
    "very bad",
    "bad",
    "not great",
    "okay",
    "neutral",
    "good",
    "very good",
    "great",
  ])
)

export function clampMoodValue(value: number): MoodValue {
  const rounded = Math.round(value)
  const clamped = Math.min(5, Math.max(1, Number.isFinite(rounded) ? rounded : 3))
  return clamped as MoodValue
}

export function getMoodLabel(value: number | MoodValue, t: (key: string) => string): string {
  return t(MOOD_LABEL_KEYS[clampMoodValue(value)])
}

/** Show translated label for generic/legacy mood notes; keep custom user text as-is. */
export function resolveMoodDisplayNote(
  note: string | undefined | null,
  moodValue: number,
  t: (key: string) => string
): string {
  const trimmed = (note || "").trim()
  if (!trimmed) return getMoodLabel(moodValue, t)

  const normalized = trimmed.toLowerCase()
  if (GENERIC_NOTE_KEYS.has(normalized)) {
    const legacy = LEGACY_NOTE_TO_VALUE[normalized]
    if (legacy != null) return getMoodLabel(legacy, t)
  }

  return trimmed
}

/** @deprecated Use getMoodLabel(value, t) in UI code. */
export function defaultMoodLabel(value: MoodValue): string {
  const fallback: Record<MoodValue, string> = {
    1: "Schlecht",
    2: "Nicht gut",
    3: "Mittel",
    4: "Gut",
    5: "Sehr gut",
  }
  return fallback[value]
}
