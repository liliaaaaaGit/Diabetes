import type { ActivityEntry, Entry, InsulinEntry, MealEntry } from "@/lib/types"

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

export function logbookEntryTypeLabel(type: Entry["type"], t: TranslateFn): string {
  const keys: Record<Entry["type"], string> = {
    glucose: "logbook.glucose",
    insulin: "logbook.insulin",
    meal: "logbook.meal",
    mood: "logbook.mood",
    activity: "logbook.activity",
  }
  return t(keys[type])
}

export function formatInsulinChipText(
  dose: number,
  insulinName: string | undefined,
  t: TranslateFn
): string {
  const doseText = dose % 1 === 0 ? String(dose) : dose.toFixed(1)
  return t("logbook.insulinChip", {
    dose: doseText,
    insulinAbbrev: t("logbook.insulinUnitsAbbrev"),
    name: insulinName || t("logbook.insulin"),
  })
}

export function formatActivityChipText(activity: ActivityEntry, t: TranslateFn): string {
  return t("logbook.activityChip", {
    type: activity.activityType || t("logbook.activity"),
    minutes: activity.durationMinutes ?? 0,
    minAbbrev: t("logbook.minutesAbbrev"),
  })
}

export function formatMealTitle(meal: MealEntry, t: TranslateFn): string {
  const carbs = meal.carbsGrams ?? 0
  const carbsText = carbs % 1 === 0 ? String(carbs) : carbs.toFixed(1)
  const description = (meal.description || t("logbook.meal")).trim()
  return `${description} · ${carbsText}g`
}
