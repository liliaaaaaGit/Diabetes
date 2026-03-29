"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InsightsTirHero } from "@/components/insights/insights-tir-hero"
import { InsightsSummaryStrip } from "@/components/insights/insights-summary-strip"
import { InsightsMoodGlucoseChart } from "@/components/insights/insights-mood-glucose-chart"
import { useTranslation } from "@/hooks/useTranslation"
import { useEntries } from "@/hooks/useEntries"
import { useConversations } from "@/hooks/useConversations"
import { useUser } from "@/hooks/useUser"
import type { GlucoseEntry } from "@/lib/types"
import {
  buildDailyMoodGlucosePoints,
  computeInsightsRange,
  glucoseTirPercents,
  averageGlucoseMgDl,
  sumInsulinUnits,
  sumCarbsGrams,
  type InsightsTimeRangeKey,
} from "@/lib/insights-aggregate"
import { cn } from "@/lib/utils"

export default function InsightsPage() {
  const { t, locale } = useTranslation()
  const { userId } = useUser()
  const [timeRange, setTimeRange] = useState<InsightsTimeRangeKey>("7d")

  const range = useMemo(() => computeInsightsRange(timeRange), [timeRange])
  const fromIso = range.from.toISOString()
  const toIso = range.to.toISOString()

  const { entries, loading, error } = useEntries({ from: fromIso, to: toIso }, userId)
  const { conversations } = useConversations(userId)

  const loc = locale === "de" ? "de" : "en"

  const glucoseEntries = useMemo(
    () => entries.filter((e) => e.type === "glucose") as GlucoseEntry[],
    [entries]
  )

  const chartPoints = useMemo(
    () => buildDailyMoodGlucosePoints(range, entries, conversations, loc),
    [range, entries, conversations, loc]
  )

  const avgMgDl = useMemo(() => averageGlucoseMgDl(glucoseEntries), [glucoseEntries])
  const tir = useMemo(() => glucoseTirPercents(glucoseEntries), [glucoseEntries])

  return (
    <AppShell title={t("pages.insights")} mainClassName="max-w-none w-full px-4 md:px-6 py-4 md:py-6">
      <div className="space-y-6 w-full max-w-[1400px] mx-auto">
        <p className="text-sm text-slate-600">{t("insights.subtitle")}</p>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as InsightsTimeRangeKey)}>
          <TabsList className="bg-slate-100/80 p-1 h-auto">
            <TabsTrigger
              value="week"
              className={cn(
                "rounded-lg px-4 py-2 text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white"
              )}
            >
              {t("insights.thisWeek")}
            </TabsTrigger>
            <TabsTrigger
              value="7d"
              className={cn(
                "rounded-lg px-4 py-2 text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white"
              )}
            >
              {t("insights.last7Days")}
            </TabsTrigger>
            <TabsTrigger
              value="30d"
              className={cn(
                "rounded-lg px-4 py-2 text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white"
              )}
            >
              {t("insights.last30Days")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}

        {!loading && (
          <>
            <InsightsTirHero avgMgDl={avgMgDl} tir={tir} />
            <InsightsSummaryStrip
              chartPoints={chartPoints}
              overallAvgGlucose={avgMgDl}
              sumInsulin={sumInsulinUnits(entries)}
              sumCarbs={sumCarbsGrams(entries)}
              entryCount={entries.length}
            />
            <InsightsMoodGlucoseChart data={chartPoints} timeRange={timeRange} />
          </>
        )}
      </div>
    </AppShell>
  )
}
