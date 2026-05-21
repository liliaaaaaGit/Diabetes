"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { InsightsPeriodTabs } from "@/components/insights/insights-period-tabs"
import { InsightsGlucoseTrendChart } from "@/components/insights/insights-glucose-trend-chart"
import { InsightsMoodTrendChart } from "@/components/insights/insights-mood-trend-chart"
import { InsightsMoodGlucoseChart } from "@/components/insights/insights-mood-glucose-chart"
import { useTranslation } from "@/hooks/useTranslation"
import { useEntries } from "@/hooks/useEntries"
import { useConversations } from "@/hooks/useConversations"
import { useUser } from "@/hooks/useUser"
import {
  buildDailyMoodGlucosePoints,
  computeInsightsRange,
  type InsightsTimeRangeKey,
} from "@/lib/insights-aggregate"

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

  const correlationPoints = useMemo(
    () => buildDailyMoodGlucosePoints(range, entries, conversations, loc, "correlation"),
    [range, entries, conversations, loc]
  )

  const dailyMoodPoints = useMemo(
    () => buildDailyMoodGlucosePoints(range, entries, conversations, loc, "daily"),
    [range, entries, conversations, loc]
  )

  return (
    <AppShell title={t("pages.insights")} mainClassName="max-w-none w-full px-4 md:px-6 py-4 md:py-6">
      <div className="space-y-8 w-full max-w-[1400px] mx-auto">
        <InsightsPeriodTabs value={timeRange} onValueChange={setTimeRange} />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}

        {!loading && (
          <>
            <InsightsGlucoseTrendChart data={correlationPoints} />
            <InsightsMoodTrendChart data={dailyMoodPoints} />
            <InsightsMoodGlucoseChart data={correlationPoints} timeRange={timeRange} />
          </>
        )}
      </div>
    </AppShell>
  )
}
