"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"

export interface ImportSummaryStats {
  totalEntries: number
  glucose: number
  insulin: number
  meal: number
  skippedRows: number
}

interface ImportSummaryProps {
  stats: ImportSummaryStats
}

export function ImportSummary({ stats }: ImportSummaryProps) {
  const { t } = useTranslation()
  const { totalEntries, glucose, insulin, meal, skippedRows } = stats

  return (
    <Card className="rounded-xl border-teal-200 bg-teal-50/40 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-teal-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-slate-900">{t("import.success")}</h3>
            <p className="text-sm text-slate-700">
              {t("import.summaryIntro", {
                total: totalEntries,
                glucose,
                insulin,
                meals: meal,
              })}
              {skippedRows > 0
                ? t("import.summaryWithSkipped", { skipped: skippedRows })
                : ")."}
            </p>
            {skippedRows > 0 ? (
              <p className="text-xs text-slate-600">{t("import.skippedHint")}</p>
            ) : null}
            <Button asChild className="mt-1">
              <Link href="/logbook">{t("import.goToLogbook")}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
