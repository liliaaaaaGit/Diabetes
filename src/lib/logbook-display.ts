import type { Locale } from "@/i18n/config"
import type { ActivityEntry, Entry, InsulinEntry, MealEntry, InsulinEntryType } from "@/lib/types"
import { formatInsulin } from "@/lib/insulin-format"
import { formatMealCarbsLabel } from "@/lib/meal-carbs"

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
  insulinEntryType: InsulinEntryType | undefined,
  t: TranslateFn,
  locale: Locale
): string {
  const base = t("logbook.insulinChip", {
    dose: formatInsulin(dose, locale),
    insulinAbbrev: t("logbook.insulinUnitsAbbrev"),
    name: insulinName || t("logbook.insulin"),
  })
  if (!insulinEntryType) return base
  const entryTypeLabel =
    insulinEntryType === "basal"
      ? t("logbook.insulinEntryBasal")
      : insulinEntryType === "correction"
        ? t("logbook.insulinEntryCorrection")
        : t("logbook.insulinEntryMealBolus")
  return `${base} · ${entryTypeLabel}`
}

export function formatActivityChipText(activity: ActivityEntry, t: TranslateFn): string {
  return t("logbook.activityChip", {
    type: activity.activityType || t("logbook.activity"),
    minutes: activity.durationMinutes ?? 0,
    minAbbrev: t("logbook.minutesAbbrev"),
  })
}

export function formatMealTitle(meal: MealEntry, t: TranslateFn, locale: Locale = "de"): string {
  const description = (meal.description || t("logbook.meal")).trim()
  const loc = locale === "en" ? "en" : "de"
  const carbsLabel = formatMealCarbsLabel(meal, loc)
  if (carbsLabel) return `${description} · ${carbsLabel}`
  return description
}
