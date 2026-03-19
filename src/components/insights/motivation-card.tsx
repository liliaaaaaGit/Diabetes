"use client"

import { Sparkles, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useState } from "react"

interface MotivationCardProps {
  quote: string
  context: string
  onRefresh: () => void
}

export function MotivationCard({ quote, context, onRefresh }: MotivationCardProps) {
  const { t } = useTranslation()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card className="rounded-xl border-amber-200 shadow-sm bg-amber-50/70">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-900">{t("insights.motivation")}</h3>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-base text-slate-900 font-medium mb-2 leading-relaxed">{quote}</p>
            {context && <p className="text-xs text-slate-600">{context}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
