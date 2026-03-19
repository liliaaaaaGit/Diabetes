"use client"

import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"

interface ImportSummaryProps {
  imported: number
  skipped: number
}

export function ImportSummary({ imported, skipped }: ImportSummaryProps) {
  const { t } = useTranslation()

  return (
    <Card className="rounded-xl border-green-200 bg-green-50/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">
              {t("import.success")}
            </h3>
            <p className="text-sm text-slate-700">
              {imported} {t("import.imported")}
              {skipped > 0 && `, ${skipped} ${t("import.skipped")}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
