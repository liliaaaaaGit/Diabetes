"use client"

import type {
  ActivityEntry,
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  MoodEntry,
} from "@/lib/types"
import { parseISO, format } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"
import { glucoseValueTextClassMgDl } from "@/lib/glucose-range-style"
import {
  formatActivityChipText,
  formatInsulinChipText,
  formatMealTitle,
  logbookEntryTypeLabel,
} from "@/lib/logbook-display"
import { resolveMoodDisplayNote } from "@/lib/mood"
import { cn } from "@/lib/utils"

interface MomentCardProps {
  entries: Entry[]
}

function isBasalLantus(entry: InsulinEntry): boolean {
  if (entry.insulinEntryType) return entry.insulinEntryType === "basal"
  const name = (entry.insulinName || "").toLowerCase()
  return entry.insulinType === "long_acting" || name.includes("lantus")
}

function pickHeroGlucose(
  glucoseEntries: GlucoseEntry[],
  mealEntries: MealEntry[]
): GlucoseEntry | undefined {
  if (glucoseEntries.length === 0) return undefined
  if (glucoseEntries.length === 1) return glucoseEntries[0]
  if (mealEntries.length === 0) return glucoseEntries[0]

  const mealTimes = mealEntries.map((meal) => parseISO(meal.timestamp).getTime())
  const byDistance = [...glucoseEntries].sort((a, b) => {
    const aTime = parseISO(a.timestamp).getTime()
    const bTime = parseISO(b.timestamp).getTime()
    const aDistance = Math.min(...mealTimes.map((mealTime) => Math.abs(mealTime - aTime)))
    const bDistance = Math.min(...mealTimes.map((mealTime) => Math.abs(mealTime - bTime)))
    return aDistance - bDistance
  })
  return byDistance[0]
}

function Chip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
      {text}
    </span>
  )
}

export function MomentCard({ entries }: MomentCardProps) {
  const { t, locale: appLocale } = useTranslation()
  const locale = appLocale === "en" ? "en" : "de"
  const { formatGlucoseWithUnit, targetRange } = useUserPreferences()
  const dateLocale = locale === "de" ? de : enUS
  const sorted = [...entries].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  )

  const meals = sorted.filter((entry) => entry.type === "meal") as MealEntry[]
  const glucoseEntries = sorted.filter((entry) => entry.type === "glucose") as GlucoseEntry[]
  const glucose = pickHeroGlucose(glucoseEntries, meals)
  const glucoseMgDl = glucose ? glucoseEntryToMgDl(glucose) : null
  const glucoseDisplay = glucoseMgDl != null ? formatGlucoseWithUnit(glucoseMgDl) : null
  const insulin = sorted.filter((entry) => entry.type === "insulin") as InsulinEntry[]
  const activities = sorted.filter((entry) => entry.type === "activity") as ActivityEntry[]
  const moods = sorted.filter((entry) => entry.type === "mood") as MoodEntry[]
  const basalInsulin = insulin.find(isBasalLantus)
  const bolusInsulin = insulin.filter((entry) => !isBasalLantus(entry))

  const anchor = sorted[0]

  const mood = moods[0]
  const moodText = mood ? resolveMoodDisplayNote(mood.note, mood.moodValue, t) : ""
  const groupStartTime = parseISO(sorted[0].timestamp).getTime()
  const groupEndTime = parseISO(sorted[sorted.length - 1].timestamp).getTime()
  const groupSpanMinutes = (groupEndTime - groupStartTime) / (1000 * 60)
  const timeText =
    groupSpanMinutes > 30
      ? `${format(parseISO(sorted[0].timestamp), "HH:mm", { locale: dateLocale })} – ${format(
          parseISO(sorted[sorted.length - 1].timestamp),
          "HH:mm",
          { locale: dateLocale }
        )}`
      : format(parseISO(anchor.timestamp), "HH:mm", { locale: dateLocale })

  const isBasalCard =
    !glucose && !!basalInsulin && meals.length === 0 && activities.length === 0 && moods.length === 0
  const isMoodCard = !glucose && moods.length > 0
  const isActivityOnly = !glucose && activities.length > 0
  const hasNonBasalInsulin = bolusInsulin.length > 0
  const hasMeals = meals.length > 0

  return (
    <article
      className={cn(
        "rounded-xl bg-white px-[18px] py-[14px] mb-2 border-[0.5px] border-gray-200",
        isBasalCard && "border-dashed"
      )}
    >
      {glucose && glucoseDisplay ? (
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-end gap-1.5">
            <span
              className={cn(
                "text-2xl font-medium leading-none",
                glucoseValueTextClassMgDl(glucoseMgDl!, targetRange.min, targetRange.max)
              )}
            >
              {glucoseDisplay.value}
            </span>
            <span className="text-[13px] text-gray-400">{glucoseDisplay.suffix}</span>
          </div>
          <span className="text-xs text-gray-400">{timeText}</span>
        </div>
      ) : (
        <div className="mb-2 flex items-start justify-between">
          {isMoodCard ? (
            <div>
              <p className="text-xs text-gray-400">{t("logbook.mood")}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[15px] font-medium text-slate-800">{moodText}</p>
                <div className="flex items-center gap-[3px]">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const filled = mood && idx < mood.moodValue
                    return (
                      <span
                        key={idx}
                        className={cn(
                          "h-2 w-2 rounded-full border",
                          filled
                            ? "border-[#1D9E75] bg-[#1D9E75]"
                            : "border-gray-200 bg-transparent"
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          ) : isBasalCard ? (
            <div className="flex items-center gap-2">
              <Chip
                text={formatInsulinChipText(
                  basalInsulin.dose,
                  basalInsulin.insulinName || t("logbook.defaultLantus"),
                  basalInsulin.insulinEntryType,
                  t,
                  locale
                )}
              />
              <span className="text-[11px] italic text-gray-400">{t("logbook.basalLabel")}</span>
            </div>
          ) : isActivityOnly ? (
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Chip key={activity.id} text={formatActivityChipText(activity, t)} />
              ))}
            </div>
          ) : hasMeals ? (
            <p className="text-[15px] font-medium text-slate-800">
              {formatMealTitle(meals[0], t, locale)}
            </p>
          ) : hasNonBasalInsulin ? (
            <p className="text-[15px] font-medium text-slate-800">{t("logbook.insulin")}</p>
          ) : (
            <p className="text-[15px] font-medium text-slate-800">
              {logbookEntryTypeLabel(sorted[0].type, t)}
            </p>
          )}
          <span className="text-xs text-gray-400">{timeText}</span>
        </div>
      )}

      {glucose ? (
        <div className="flex flex-wrap gap-2">
          {meals.map((meal) => (
            <Chip key={meal.id} text={formatMealTitle(meal, t, locale)} />
          ))}
          {bolusInsulin.map((entry) => (
            <Chip
              key={entry.id}
              text={formatInsulinChipText(
                entry.dose,
                entry.insulinName,
                entry.insulinEntryType,
                t,
                locale
              )}
            />
          ))}
          {activities.map((activity) => (
            <Chip key={activity.id} text={formatActivityChipText(activity, t)} />
          ))}
        </div>
      ) : hasMeals || hasNonBasalInsulin || isActivityOnly ? (
        <div className="flex flex-wrap gap-2">
          {hasMeals
            ? meals.slice(1).map((meal) => (
                <Chip key={meal.id} text={formatMealTitle(meal, t, locale)} />
              ))
            : null}
          {bolusInsulin.map((entry) => (
            <Chip
              key={entry.id}
              text={formatInsulinChipText(
                entry.dose,
                entry.insulinName,
                entry.insulinEntryType,
                t,
                locale
              )}
            />
          ))}
          {!glucose
            ? activities.map((activity) => (
                <Chip key={activity.id} text={formatActivityChipText(activity, t)} />
              ))
            : null}
        </div>
      ) : null}
    </article>
  )
}

interface EntryCardProps {
  entry: Entry
}

/** Backward-compatible wrapper for old usages. */
export function EntryCard({ entry }: EntryCardProps) {
  return <MomentCard entries={[entry]} />
}
