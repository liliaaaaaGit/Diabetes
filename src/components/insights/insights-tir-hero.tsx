"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { averageGlucoseLabelClass } from "@/lib/insights-aggregate"

interface InsightsTirHeroProps {
  avgMgDl: number | null
  tir: { under: number; inRange: number; over: number }
}

export function InsightsTirHero({ avgMgDl, tir }: InsightsTirHeroProps) {
  const { t } = useTranslation()
  const hasData = tir.under + tir.inRange + tir.over > 0

  return (
    <Card className="rounded-xl border-teal-100 bg-white shadow-sm w-full">
      <CardContent className="p-5 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">{t("insights.tirBlockTitle")}</h2>
        {!hasData ? (
          <p className="text-sm text-slate-500 text-center py-6">{t("empty.glucoseChartEmpty")}</p>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="flex flex-col justify-center lg:w-[min(100%,280px)] shrink-0">
              <p className="text-sm font-medium text-slate-600 mb-1">{t("insights.avgGlucoseLargeLabel")}</p>
              <p
                className={cn(
                  "text-4xl md:text-5xl font-bold tabular-nums tracking-tight",
                  averageGlucoseLabelClass(avgMgDl)
                )}
              >
                {avgMgDl != null ? (
                  <>
                    {avgMgDl} <span className="text-xl md:text-2xl font-semibold text-slate-500">{t("units.mgdl")}</span>
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-2">{t("insights.tirBandHint")}</p>
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <p className="text-sm font-medium text-slate-700">{t("insights.timeInRange")}</p>
              <div className="flex h-14 w-full rounded-xl overflow-hidden shadow-inner ring-1 ring-slate-200/80">
                {tir.under > 0 && (
                  <div
                    className="h-full bg-red-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold px-1 transition-[width] min-w-0"
                    style={{ width: `${tir.under}%` }}
                    title={`${t("insights.underTarget")}: ${tir.under}%`}
                  >
                    {tir.under >= 8 ? `${tir.under}%` : ""}
                  </div>
                )}
                {tir.inRange > 0 && (
                  <div
                    className="h-full bg-emerald-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold px-1 min-w-0"
                    style={{ width: `${tir.inRange}%` }}
                    title={`${t("insights.inTarget")}: ${tir.inRange}%`}
                  >
                    {tir.inRange >= 8 ? `${tir.inRange}%` : ""}
                  </div>
                )}
                {tir.over > 0 && (
                  <div
                    className="h-full bg-teal-900 flex items-center justify-center text-white text-xs sm:text-sm font-semibold px-1 min-w-0"
                    style={{ width: `${tir.over}%` }}
                    title={`${t("insights.overTarget")}: ${tir.over}%`}
                  >
                    {tir.over >= 8 ? `${tir.over}%` : ""}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-500 shrink-0" />
                  {t("insights.underTarget")} ({tir.under}%)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shrink-0" />
                  {t("insights.inTarget")} ({tir.inRange}%)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-teal-900 shrink-0" />
                  {t("insights.overTarget")} ({tir.over}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
