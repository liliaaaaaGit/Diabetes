"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Annoyed,
  Droplet,
  Frown,
  Info,
  Laugh,
  Meh,
  Smile,
  Syringe,
  UtensilsCrossed,
} from "lucide-react"
import type {
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  ActivityEntry,
  MoodEntry,
} from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { cn } from "@/lib/utils"
import { glucoseValueTextClassMgDl } from "@/lib/glucose-range-style"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"
import { formatInsulin } from "@/lib/insulin-format"
import {
  formatMealCarbsLabel,
  hasAiMealEstimate,
  isHighProteinFatLowCarb,
  isPhotoMealEstimate,
} from "@/lib/meal-carbs"
import { getMoodLabel } from "@/lib/mood"
import { MealConfidenceBadge } from "@/components/logbook/meal-confidence-badge"
import { MealDetailSheet } from "@/components/logbook/meal-detail-sheet"

const moodIcons: Record<number, LucideIcon> = {
  1: Annoyed,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

const rowIconClass = "h-4 w-4 shrink-0 text-slate-400"
const moodIconClass = "h-[18px] w-[18px] shrink-0 text-slate-400"

const tsOf = (e: { timestamp: string }) => parseISO(e.timestamp).getTime()

interface LogbookUnifiedEntryCardProps {
  entries: Entry[]
  /** All entries of the selected day — used to show context near a mood entry. */
  dayEntries?: Entry[]
  onMealUpdated?: () => void
}

export function LogbookUnifiedEntryCard({
  entries,
  dayEntries = [],
  onMealUpdated,
}: LogbookUnifiedEntryCardProps) {
  const { t, locale: appLocale } = useTranslation()
  const loc = appLocale === "en" ? "en" : "de"
  const { formatGlucoseWithUnit, targetRange, unitSuffix, mgDlToDisplayValue } =
    useUserPreferences()
  const dateLocale = loc === "de" ? de : enUS
  const [expanded, setExpanded] = useState(false)
  const [mealDetail, setMealDetail] = useState<MealEntry | null>(null)

  const sorted = [...entries].sort((a, b) => tsOf(a) - tsOf(b))
  const anchor = sorted[0]
  const fmtTime = (iso: string) => format(parseISO(iso), "HH:mm", { locale: dateLocale })
  const timeLabel = fmtTime(anchor.timestamp)

  const notes = sorted.map((e) => e.note).filter(Boolean) as string[]
  const noteText = notes.join("\n\n")

  const glucoseList = sorted.filter((e) => e.type === "glucose") as GlucoseEntry[]
  const insulinList = sorted.filter((e) => e.type === "insulin") as InsulinEntry[]
  const mealList = sorted.filter((e) => e.type === "meal") as MealEntry[]
  const activityList = sorted.filter((e) => e.type === "activity") as ActivityEntry[]
  const moodList = sorted.filter((e) => e.type === "mood") as MoodEntry[]

  const showAiDisclaimer = mealList.some(hasAiMealEstimate)
  const showPhotoDisclaimer = mealList.some(isPhotoMealEstimate)
  const showProteinFatHint = mealList.some(isHighProteinFatLowCarb)

  const isMoodCard = entries.length === 1 && entries[0].type === "mood"
  const isMealEpisode = mealList.length >= 1 && glucoseList.length >= 1

  /** Glucose value pill (color-coded with the calmer palette). */
  const glucoseValue = (g: GlucoseEntry) => {
    const mg = glucoseEntryToMgDl(g)
    const f = formatGlucoseWithUnit(mg)
    return (
      <span
        className={cn(
          "font-semibold tabular-nums",
          glucoseValueTextClassMgDl(mg, targetRange.min, targetRange.max)
        )}
      >
        {f.value} {f.suffix}
      </span>
    )
  }

  // ---- Meal episode: Vorher → Mahlzeit → Nachher ------------------------
  const renderEpisode = () => {
    const mealTime = Math.min(...mealList.map(tsOf))
    const before = glucoseList
      .filter((g) => tsOf(g) <= mealTime)
      .sort((a, b) => tsOf(b) - tsOf(a))[0] // closest before
    const after = glucoseList
      .filter((g) => tsOf(g) > mealTime)
      .sort((a, b) => tsOf(a) - tsOf(b))[0] // closest after

    const primaryMeal = mealList[0]
    const carbsLabel = formatMealCarbsLabel(primaryMeal, loc) ?? primaryMeal.description

    let diffMg: number | null = null
    if (before && after) {
      diffMg = glucoseEntryToMgDl(after) - glucoseEntryToMgDl(before)
    }
    const diffDisplay = diffMg != null ? mgDlToDisplayValue(Math.abs(diffMg)) : null
    const diffSign = diffMg != null && diffMg >= 0 ? "+" : "−"

    const mealTypeLabel = t(`logbook.${primaryMeal.mealType}`)

    return (
      <div className="mt-1">
        <p className="mb-2 text-xs font-medium text-slate-500">{mealTypeLabel}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Vorher */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {t("logbook.episodeBefore")}
            </span>
            {before ? glucoseValue(before) : <span className="text-slate-300">—</span>}
            {before ? (
              <span className="text-[11px] text-slate-400">{fmtTime(before.timestamp)}</span>
            ) : null}
          </div>

          {/* Mahlzeit */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {t("logbook.episodeMeal")}
            </span>
            <button
              type="button"
              onClick={() => setMealDetail(primaryMeal)}
              className="font-semibold text-slate-900 underline-offset-2 hover:underline"
            >
              {carbsLabel}
            </button>
            <span className="text-[11px] text-slate-400">{fmtTime(primaryMeal.timestamp)}</span>
          </div>

          {/* Nachher */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {t("logbook.episodeAfter")}
            </span>
            {after ? glucoseValue(after) : <span className="text-slate-300">—</span>}
            {after ? (
              <span className="text-[11px] text-slate-400">{fmtTime(after.timestamp)}</span>
            ) : null}
          </div>
        </div>

        {/* Bolus (documented, never evaluated) */}
        {insulinList.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {insulinList.map((ins) => (
              <div key={ins.id} className="flex items-center gap-2 text-sm">
                <Syringe className={rowIconClass} aria-hidden strokeWidth={2} />
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatInsulin(ins.dose, loc)} {t("logbook.insulinUnitsAbbrev")}
                </span>
                {ins.insulinName ? (
                  <span className="text-slate-500">{ins.insulinName}</span>
                ) : null}
                <span className="text-[11px] text-slate-400">({fmtTime(ins.timestamp)})</span>
              </div>
            ))}
          </div>
        )}

        {/* Reflective only — difference, no evaluation of the dose. */}
        {diffDisplay != null && (
          <p className="mt-3 text-sm text-slate-600">
            {t("logbook.episodeDifference")}: {diffSign}
            {diffDisplay} {unitSuffix}
          </p>
        )}

        {/* Extra meals in the same episode (rare). */}
        {mealList.slice(1).map((m) => {
          const label = formatMealCarbsLabel(m, loc) ?? m.description
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMealDetail(m)}
              className="mt-2 flex items-center gap-2 text-sm text-slate-700 hover:underline"
            >
              <UtensilsCrossed className={rowIconClass} aria-hidden strokeWidth={2} />
              {label}
            </button>
          )
        })}

        {mealList.some((m) => hasAiMealEstimate(m)) && (
          <div className="mt-2 flex justify-end">
            <MealConfidenceBadge confidence={primaryMeal.carbsConfidence} />
          </div>
        )}
      </div>
    )
  }

  // ---- Mood card with nearby context (P1.2) -----------------------------
  const renderMood = () => {
    const mood = moodList[0]
    const MoodIcon = moodIcons[mood.moodValue] ?? Meh
    const moodTime = tsOf(mood)

    const others = dayEntries.filter((e) => e.id !== mood.id)
    const closestGlucose = others
      .filter((e): e is GlucoseEntry => e.type === "glucose")
      .map((e) => ({ e, d: Math.abs(tsOf(e) - moodTime) }))
      .filter((x) => x.d <= 90 * 60000)
      .sort((a, b) => a.d - b.d)[0]?.e
    const recentMeal = others
      .filter((e): e is MealEntry => e.type === "meal")
      .map((e) => ({ e, d: Math.abs(tsOf(e) - moodTime) }))
      .filter((x) => x.d <= 180 * 60000)
      .sort((a, b) => a.d - b.d)[0]?.e

    const hasContext = closestGlucose || recentMeal

    return (
      <div className="mt-1">
        <div className="flex items-center gap-2">
          <MoodIcon
            className={moodIconClass}
            aria-hidden
            strokeWidth={1.5}
            fill="none"
            stroke="currentColor"
          />
          <span className="font-medium text-slate-900">
            {getMoodLabel(mood.moodValue, t)}
          </span>
        </div>

        {mood.note ? (
          <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap break-words">
            {mood.note}
          </p>
        ) : null}

        {hasContext && (
          <div className="mt-2 text-[13px] leading-relaxed text-slate-400">
            <span className="font-medium">{t("logbook.contextLabel")}:</span>{" "}
            {closestGlucose ? (
              <span>
                {t("logbook.glucose")} {formatGlucoseWithUnit(glucoseEntryToMgDl(closestGlucose)).value}{" "}
                {unitSuffix} ({fmtTime(closestGlucose.timestamp)})
              </span>
            ) : null}
            {closestGlucose && recentMeal ? <br /> : null}
            {recentMeal ? (
              <span>
                {formatMealCarbsLabel(recentMeal, loc) ?? recentMeal.description} (
                {fmtTime(recentMeal.timestamp)})
              </span>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  // ---- Flat list (isolated entries) -------------------------------------
  const renderFlat = () => (
    <div
      className="mt-2 flex flex-col gap-2"
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setExpanded(!expanded)
      }}
      role="button"
      tabIndex={0}
    >
      {glucoseList.map((g) => (
        <div key={g.id} className="flex items-center gap-2 text-base">
          <Droplet className={rowIconClass} aria-hidden strokeWidth={2} />
          {glucoseValue(g)}
        </div>
      ))}

      {insulinList.map((ins) => (
        <div key={ins.id} className="flex items-center gap-2 text-base flex-wrap">
          <Syringe className={rowIconClass} aria-hidden strokeWidth={2} />
          <span className="font-semibold text-slate-900 tabular-nums">
            {formatInsulin(ins.dose, loc)} {t("logbook.insulinUnitsAbbrev")}
          </span>
          {ins.insulinName ? (
            <span className="text-sm text-slate-500">{ins.insulinName}</span>
          ) : null}
        </div>
      ))}

      {mealList.map((m) => {
        const carbsLabel = formatMealCarbsLabel(m, loc)
        if (!carbsLabel && !m.description) return null
        return (
          <button
            key={m.id}
            type="button"
            className="flex w-full items-center gap-2 text-left text-base min-h-[44px] -mx-1 px-1 rounded-lg hover:bg-slate-50"
            onClick={(e) => {
              e.stopPropagation()
              setMealDetail(m)
            }}
          >
            <UtensilsCrossed className={rowIconClass} aria-hidden strokeWidth={2} />
            <span className="font-semibold text-slate-900 flex-1 min-w-0 truncate">
              {carbsLabel ?? m.description}
            </span>
            <MealConfidenceBadge confidence={m.carbsConfidence} />
          </button>
        )
      })}

      {activityList.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-base">
          <Activity className={rowIconClass} aria-hidden strokeWidth={2} />
          <span className="font-medium text-slate-900">
            {a.activityType} · {a.durationMinutes} {t("units.minutes")}
          </span>
        </div>
      ))}

      {moodList.map((m) => {
        const MoodIcon = moodIcons[m.moodValue] ?? Meh
        return (
          <div key={m.id} className="flex items-center gap-2 text-base">
            <MoodIcon
              className={moodIconClass}
              aria-hidden
              strokeWidth={1.5}
              fill="none"
              stroke="currentColor"
            />
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <Card
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white shadow-sm",
          "transition-all hover:shadow-md"
        )}
      >
        <CardContent className="p-4">
          {showPhotoDisclaimer && (
            <p className="mb-1 text-[10px] leading-snug text-slate-500">{t("logbook.photoDisclaimer")}</p>
          )}
          {showAiDisclaimer && (
            <p className="mb-2 text-[10px] leading-snug text-slate-500">{t("logbook.aiCarbsDisclaimer")}</p>
          )}

          <p className="text-lg font-bold text-slate-900 tabular-nums">{timeLabel}</p>

          {isMoodCard ? renderMood() : isMealEpisode ? renderEpisode() : renderFlat()}

          {showProteinFatHint && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
              <p className="text-[12px] leading-snug text-slate-500">
                {t("logbook.proteinFatHint")}
              </p>
            </div>
          )}

          {!isMoodCard && noteText && expanded ? (
            <div className="mt-3 border-t border-slate-100 pt-2 text-sm text-slate-600 whitespace-pre-wrap break-words">
              {noteText}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <MealDetailSheet
        meal={mealDetail}
        open={mealDetail != null}
        onOpenChange={(open) => !open && setMealDetail(null)}
        onCorrected={() => {
          onMealUpdated?.()
          setMealDetail(null)
        }}
      />
    </>
  )
}
