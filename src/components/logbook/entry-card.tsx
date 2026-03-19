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
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"

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
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const time = format(parseISO(entry.timestamp), "HH:mm", { locale: de })

  const getIcon = () => {
    switch (entry.type) {
      case "glucose":
        return <Droplet className="h-5 w-5 text-blue-600" />
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

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.glucose")}
                </Badge>
                <span className="text-sm text-slate-500">{contextText}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-lg font-semibold text-slate-900">
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

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.insulin")}
                </Badge>
                {insulinEntry.insulinName && (
                  <span className="text-sm text-slate-600">{insulinEntry.insulinName}</span>
                )}
                <Badge variant="outline" className="text-xs">
                  {typeText}
                </Badge>
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

        return (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {t("logbook.meal")}
                </Badge>
                <span className="text-sm font-semibold text-slate-900">
                  {mealEntry.description}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {mealTypeText}
                </Badge>
                {mealEntry.carbsGrams && (
                  <span className="text-xs text-slate-600">
                    {mealEntry.carbsGrams}g {t("dashboard.carbs")}
                  </span>
                )}
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
