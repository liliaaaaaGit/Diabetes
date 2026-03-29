"use client"

import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
} from "lucide-react"
import { Entry, GlucoseEntry, InsulinEntry, MealEntry, ActivityEntry, MoodEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { formatDistanceToNow, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"

interface RecentActivityFeedProps {
  entries: Entry[]
  limit?: number
}

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

export function RecentActivityFeed({ entries, limit = 8 }: RecentActivityFeedProps) {
  const { t } = useTranslation()

  const recentEntries = entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  const formatEntry = (entry: Entry): { icon: React.ReactNode; text: string; color: string } => {
    switch (entry.type) {
      case "glucose": {
        const glucoseEntry = entry as GlucoseEntry
        const unit = glucoseEntry.unit === "mg_dl" ? "mg/dL" : "mmol/L"
        let contextText = ""
        if (glucoseEntry.context === "fasting") contextText = t("dashboard.fasting")
        else if (glucoseEntry.context === "pre_meal") contextText = t("dashboard.beforeMeal")
        else if (glucoseEntry.context === "post_meal") contextText = t("dashboard.afterMeal")
        else if (glucoseEntry.context === "bedtime") contextText = t("dashboard.bedtime")
        else contextText = t("dashboard.other")

        return {
          icon: <Droplet className="h-5 w-5 text-teal-600" />,
          text: `${glucoseEntry.value} ${unit} – ${contextText}`,
          color: "teal",
        }
      }
      case "insulin": {
        const insulinEntry = entry as InsulinEntry
        return {
          icon: <Syringe className="h-5 w-5 text-purple-600" />,
          text: `${insulinEntry.dose} IE ${insulinEntry.insulinName || ""}`,
          color: "purple",
        }
      }
      case "meal": {
        const mealEntry = entry as MealEntry
        const carbsText = mealEntry.carbsGrams
          ? ` • ${mealEntry.carbsGrams}g ${t("dashboard.carbs")}`
          : ""
        return {
          icon: <UtensilsCrossed className="h-5 w-5 text-orange-600" />,
          text: `${mealEntry.description}${carbsText}`,
          color: "orange",
        }
      }
      case "activity": {
        const activityEntry = entry as ActivityEntry
        return {
          icon: <Activity className="h-5 w-5 text-green-600" />,
          text: `${activityEntry.activityType} • ${activityEntry.durationMinutes} ${t("units.minutes")}`,
          color: "green",
        }
      }
      case "mood": {
        const moodEntry = entry as MoodEntry
        return {
          icon: <Heart className="h-5 w-5 text-pink-600" />,
          text: moodEmojis[moodEntry.moodValue] || "😐",
          color: "pink",
        }
      }
      default:
        return {
          icon: null,
          text: "",
          color: "slate",
        }
    }
  }

  const getRelativeTime = (timestamp: string): string => {
    try {
      const date = parseISO(timestamp)
      const distance = formatDistanceToNow(date, { addSuffix: true, locale: de })
      return distance.replace("vor ", "").replace("in ", "")
    } catch {
      return ""
    }
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t("dashboard.recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {t("common.noData")}
            </p>
          ) : (
            recentEntries.map((entry) => {
              const formatted = formatEntry(entry)
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">{formatted.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{formatted.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
