"use client"

import { Lightbulb } from "lucide-react"
import { Insight } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"

interface DailyInsightCardProps {
  insight: Insight
}

export function DailyInsightCard({ insight }: DailyInsightCardProps) {
  const { t } = useTranslation()

  // For motivation insights, show title (quote) as main text and description (context) as subtitle
  const isMotivation = insight.type === "motivation"
  const mainText = isMotivation ? insight.title : insight.description
  const subtitle = isMotivation ? insight.description : undefined

  return (
    <Card className="rounded-xl border-0 shadow-sm bg-gradient-to-r from-teal-500 to-teal-600 text-white">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/10 flex-shrink-0">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1">
              {isMotivation ? t("insights.motivation") : t("dashboard.dailyInsight")}
            </p>
            <p className="text-sm md:text-base font-medium leading-relaxed">
              {mainText}
            </p>
            {subtitle && (
              <p className="text-xs md:text-sm text-teal-50/90 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
