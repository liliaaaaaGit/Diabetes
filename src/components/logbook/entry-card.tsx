"use client"

import { useState } from "react"
import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
} from "lucide-react"
import { Entry, GlucoseEntry, InsulinEntry, MealEntry, ActivityEntry, MoodEntry } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { cn } from "@/lib/utils"
import { glucoseValueTextClassMgDl } from "@/lib/glucose-range-style"
import { CSV_IMPORT_MEAL_DESCRIPTION } from "@/lib/constants"

function glucoseMgDl(e: GlucoseEntry): number {
  return e.unit === "mmol_l" ? e.value * 18.0182 : e.value
}

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

interface EntryCardProps {
  entry: Entry
}

export function EntryCard({ entry }: EntryCardProps) {
  const { t, locale } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const dateLocale = locale === "de" ? de : enUS

  const time = format(parseISO(entry.timestamp), "HH:mm", { locale: dateLocale })

  const getIcon = () => {
    switch (entry.type) {
      case "glucose":
        return <Droplet className="h-5 w-5 text-teal-600" />
      case "insulin":
        return <Syringe className="h-5 w-5 text-purple-600" />
      case "meal":
        return <UtensilsCrossed className="h-5 w-5 text-orange-600" />
      case "activity":
        return <Activity className="h-5 w-5 text-green-600" />
      case "mood":
        return <Heart className="h-5 w-5 text-pink-600" />
    }
  }

  const getContent = () => {
    switch (entry.type) {
      case "glucose": {
        const glucoseEntry = entry as GlucoseEntry
        const unit = glucoseEntry.unit === "mg_dl" ? t("units.mgdl") : t("units.mmoll")
        let contextText = ""
        if (glucoseEntry.context === "fasting") contextText = t("dashboard.fasting")
        else if (glucoseEntry.context === "pre_meal") contextText = t("dashboard.beforeMeal")
        else if (glucoseEntry.context === "post_meal") contextText = t("dashboard.afterMeal")
        else if (glucoseEntry.context === "bedtime") contextText = t("dashboard.bedtime")
        else contextText = t("dashboard.other")

        const hideContext =
          entry.source === "import" && glucoseEntry.context === "other"

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.glucose")}
                </Badge>
                {!hideContext && contextText ? (
                  <span className="text-sm text-slate-500">{contextText}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  glucoseValueTextClassMgDl(glucoseMgDl(glucoseEntry))
                )}
              >
                {glucoseEntry.value} {unit}
              </span>
            </div>
          </>
        )
      }
      case "insulin": {
        const insulinEntry = entry as InsulinEntry
        let typeText = ""
        if (insulinEntry.insulinType === "rapid") typeText = t("logbook.rapid")
        else if (insulinEntry.insulinType === "long_acting") typeText = t("logbook.longActing")
        else if (insulinEntry.insulinType === "mixed") typeText = t("logbook.mixed")
        else typeText = t("logbook.other")

        const hideTypeBadge =
          entry.source === "import" &&
          insulinEntry.insulinType === "other" &&
          !insulinEntry.insulinName

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.insulin")}
                </Badge>
                {insulinEntry.insulinName && (
                  <span className="text-sm text-slate-600">{insulinEntry.insulinName}</span>
                )}
                {!hideTypeBadge ? (
                  <Badge variant="outline" className="text-xs">
                    {typeText}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-lg font-semibold text-slate-900">
                {insulinEntry.dose} {t("units.units")}
              </span>
            </div>
          </>
        )
      }
      case "meal": {
        const mealEntry = entry as MealEntry
        let mealTypeText = ""
        if (mealEntry.mealType === "breakfast") mealTypeText = t("logbook.breakfast")
        else if (mealEntry.mealType === "lunch") mealTypeText = t("logbook.lunch")
        else if (mealEntry.mealType === "dinner") mealTypeText = t("logbook.dinner")
        else mealTypeText = t("logbook.snack")

        const hideMealTypeBadge =
          entry.source === "import" &&
          mealEntry.mealType === "snack" &&
          mealEntry.description === CSV_IMPORT_MEAL_DESCRIPTION

        const showDescription =
          mealEntry.description &&
          !(entry.source === "import" && mealEntry.description === CSV_IMPORT_MEAL_DESCRIPTION)

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.meal")}
                </Badge>
                {showDescription ? (
                  <span className="text-sm font-semibold text-slate-900">{mealEntry.description}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {!hideMealTypeBadge ? (
                  <Badge variant="outline" className="text-xs">
                    {mealTypeText}
                  </Badge>
                ) : null}
                {mealEntry.carbsGrams != null && mealEntry.carbsGrams > 0 ? (
                  <span className="text-xs text-slate-600">
                    {mealEntry.carbsGrams}g {t("dashboard.carbs")}
                  </span>
                ) : null}
              </div>
            </div>
          </>
        )
      }
      case "activity": {
        const activityEntry = entry as ActivityEntry
        let intensityText = ""
        if (activityEntry.intensity === "low") intensityText = t("logbook.low")
        else if (activityEntry.intensity === "medium") intensityText = t("logbook.medium")
        else intensityText = t("logbook.high")

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.activity")}
                </Badge>
                <span className="text-sm font-semibold text-slate-900">
                  {activityEntry.activityType}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-600">
                  {activityEntry.durationMinutes} {t("units.minutes")}
                </span>
                <Badge variant="outline" className="text-xs">
                  {intensityText}
                </Badge>
              </div>
            </div>
          </>
        )
      }
      case "mood": {
        const moodEntry = entry as MoodEntry
        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.mood")}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={cn(
                    "text-xl transition-transform",
                    value === moodEntry.moodValue && "scale-125",
                    // neutral, nicht „ampelartig“ werten
                    value <= 2 && "text-amber-500",
                    value === 3 && "text-slate-500",
                    value >= 4 && "text-teal-500"
                  )}
                >
                  {moodEmojis[value]}
                </span>
              ))}
            </div>
          </>
        )
      }
    }
  }

  return (
    <Card
      className={cn(
        "rounded-xl border-slate-200 shadow-sm cursor-pointer transition-all",
        "hover:shadow-md min-h-[44px]"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 flex items-center justify-between gap-4">
            {getContent()}
          </div>
          <div className="flex-shrink-0 text-xs text-slate-500">{time}</div>
        </div>
        {entry.note && (
          <div
            className={cn(
              "mt-3 text-sm text-slate-600 overflow-hidden transition-all",
              expanded ? "max-h-none" : "max-h-5 line-clamp-1"
            )}
          >
            {entry.note}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
