"use client"

import { HeartHandshake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"

export function AssistantIntroCard() {
  const { t } = useTranslation()

  return (
    <Card className="rounded-xl border-0 bg-rose-50 shadow-sm">
      <CardContent className="p-6 md:p-7">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-11 w-11 rounded-full bg-rose-500 flex items-center justify-center">
              <HeartHandshake className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">
              {t("buddy.introTitle")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("buddy.intro")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
