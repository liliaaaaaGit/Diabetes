"use client"

import { Insight } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, MessageCircle, X } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface InsightCardProps {
  insight: Insight
  onDismiss: (id: string) => void
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const { t } = useTranslation()

  const getIcon = () => {
    switch (insight.type) {
      case "pattern":
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case "stat":
        return <BarChart3 className="h-5 w-5 text-green-600" />
      case "theme":
        return <MessageCircle className="h-5 w-5 text-purple-600" />
    }
  }

  const getBorderColor = () => {
    switch (insight.type) {
      case "pattern":
        return "border-l-4 border-l-teal-500"
      case "stat":
        return "border-l-4 border-l-sky-500"
      case "theme":
        return "border-l-4 border-l-amber-500"
    }
  }

  return (
    <Card className={cn("rounded-xl border-slate-200 shadow-sm", getBorderColor())}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {insight.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
              <p className="text-xs text-slate-500 italic">
                {t("insights.discussWithTeam")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 min-h-[44px] min-w-[44px]"
            onClick={() => onDismiss(insight.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
