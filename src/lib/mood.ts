import type { MoodValue } from "@/lib/types"

const DEFAULT_MOOD_LABELS_DE: Record<MoodValue, string> = {
  1: "Sehr schlecht",
  2: "Schlecht",
  3: "Geht so",
  4: "Gut",
  5: "Sehr gut",
}

export function clampMoodValue(value: number): MoodValue {
  const rounded = Math.round(value)
  const clamped = Math.min(5, Math.max(1, Number.isFinite(rounded) ? rounded : 3))
  return clamped as MoodValue
}

export function defaultMoodLabel(value: MoodValue): string {
  return DEFAULT_MOOD_LABELS_DE[value]
}

