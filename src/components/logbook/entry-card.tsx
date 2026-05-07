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
import { cn } from "@/lib/utils"

interface MomentCardProps {
  entries: Entry[]
}

function toMgDl(glucose: GlucoseEntry): number {
  return glucose.unit === "mmol_l" ? glucose.value * 18.0182 : glucose.value
}

function bgValueClass(mgDl: number): string {
  if (mgDl > 180) return "text-[#E24B4A]"
  if (mgDl < 70 || mgDl >= 140) return "text-[#BA7517]"
  return "text-[#1D9E75]"
}

function isBasalLantus(entry: InsulinEntry): boolean {
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

function formatDose(dose: number): string {
  return dose % 1 === 0 ? String(dose) : dose.toFixed(1)
}

function formatCarbs(meal: MealEntry): string {
  const carbs = meal.carbsGrams ?? 0
  const carbsText = carbs % 1 === 0 ? String(carbs) : carbs.toFixed(1)
  return `${carbsText}g`
}

function moodLabel(value: number): string {
  if (value <= 1) return "Sehr schlecht"
  if (value === 2) return "Eher schlecht"
  if (value === 3) return "Ganz okay"
  if (value === 4) return "Gut"
  return "Sehr gut"
}

function Chip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
      {text}
    </span>
  )
}

export function MomentCard({ entries }: MomentCardProps) {
  const { locale } = useTranslation()
  const dateLocale = locale === "en" ? enUS : de
  const sorted = [...entries].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  )

  const meals = sorted.filter((entry) => entry.type === "meal") as MealEntry[]
  const glucoseEntries = sorted.filter((entry) => entry.type === "glucose") as GlucoseEntry[]
  const glucose = pickHeroGlucose(glucoseEntries, meals)
  const insulin = sorted.filter((entry) => entry.type === "insulin") as InsulinEntry[]
  const activities = sorted.filter((entry) => entry.type === "activity") as ActivityEntry[]
  const moods = sorted.filter((entry) => entry.type === "mood") as MoodEntry[]
  const basalInsulin = insulin.find(isBasalLantus)
  const bolusInsulin = insulin.filter((entry) => !isBasalLantus(entry))

  const anchor = sorted[0]

  const mood = moods[0]
  const moodText = (mood?.note || "").trim() || (mood ? moodLabel(mood.moodValue) : "")
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
      {glucose ? (
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-end gap-1.5">
            <span className={cn("text-2xl font-medium leading-none", bgValueClass(toMgDl(glucose)))}>
              {Math.round(toMgDl(glucose))}
            </span>
            <span className="text-[13px] text-gray-400">mg/dL</span>
          </div>
          <span className="text-xs text-gray-400">{timeText}</span>
        </div>
      ) : (
        <div className="mb-2 flex items-start justify-between">
          {isMoodCard ? (
            <div>
              <p className="text-xs text-gray-400">Stimmung</p>
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
              <Chip text={`${formatDose(basalInsulin.dose)} IE ${basalInsulin.insulinName || "Lantus"}`} />
              <span className="text-[11px] italic text-gray-400">Basal</span>
            </div>
          ) : isActivityOnly ? (
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Chip
                  key={activity.id}
                  text={`${activity.activityType || "Aktivitaet"} · ${activity.durationMinutes} Min`}
                />
              ))}
            </div>
          ) : hasMeals ? (
            <p className="text-[15px] font-medium text-slate-800">
              {(meals[0].description || "Mahlzeit").trim()} · {formatCarbs(meals[0])}
            </p>
          ) : hasNonBasalInsulin ? (
            <p className="text-[15px] font-medium text-slate-800">Insulin</p>
          ) : (
            <p className="text-[15px] font-medium text-slate-800">
              {sorted[0].type === "meal"
                ? "Mahlzeit"
                : sorted[0].type === "insulin"
                  ? "Insulin"
                  : sorted[0].type === "mood"
                    ? "Stimmung"
                    : sorted[0].type === "activity"
                      ? "Aktivitaet"
                      : "Eintrag"}
            </p>
          )}
          <span className="text-xs text-gray-400">{timeText}</span>
        </div>
      )}

      {glucose ? (
        <div className="flex flex-wrap gap-2">
          {meals.map((meal) => (
            <Chip
              key={meal.id}
              text={`${meal.description || "Mahlzeit"} · ${formatCarbs(meal)}`}
            />
          ))}
          {bolusInsulin.map((entry) => (
            <Chip
              key={entry.id}
              text={`${formatDose(entry.dose)} IE ${entry.insulinName || "Insulin"}`}
            />
          ))}
          {activities.map((activity) => (
            <Chip
              key={activity.id}
              text={`${activity.activityType || "Aktivitaet"} · ${activity.durationMinutes} Min`}
            />
          ))}
        </div>
      ) : hasMeals || hasNonBasalInsulin || isActivityOnly ? (
        <div className="flex flex-wrap gap-2">
          {hasMeals
            ? meals.slice(1).map((meal) => (
                <Chip
                  key={meal.id}
                  text={`${meal.description || "Mahlzeit"} · ${formatCarbs(meal)}`}
                />
              ))
            : null}
          {bolusInsulin.map((entry) => (
            <Chip
              key={entry.id}
              text={`${formatDose(entry.dose)} IE ${entry.insulinName || "Insulin"}`}
            />
          ))}
          {!glucose
            ? activities.map((activity) => (
                <Chip
                  key={activity.id}
                  text={`${activity.activityType || "Aktivitaet"} · ${activity.durationMinutes} Min`}
                />
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
