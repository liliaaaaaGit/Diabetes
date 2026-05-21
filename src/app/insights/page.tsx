"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { InsightsPeriodTabs } from "@/components/insights/insights-period-tabs"
import { InsightsTirHero } from "@/components/insights/insights-tir-hero"
import { InsightsGlucoseDailyCard } from "@/components/insights/insights-glucose-daily-card"
import { InsightsMoodRadarSection } from "@/components/insights/insights-mood-radar-section"
import { InsightsMoodGlucoseChart } from "@/components/insights/insights-mood-glucose-chart"
import { useTranslation } from "@/hooks/useTranslation"
import { useEntries } from "@/hooks/useEntries"
import { useConversations } from "@/hooks/useConversations"
import { useUser } from "@/hooks/useUser"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import type { GlucoseEntry } from "@/lib/types"
import {
  buildDailyMoodGlucosePoints,
  computeInsightsRange,
  glucoseTirPercents,
  averageGlucoseMgDl,
  type InsightsTimeRangeKey,
} from "@/lib/insights-aggregate"

export default function InsightsPage() {
  const { t, locale } = useTranslation()
  const { userId } = useUser()
  const { targetMinMgDl, targetMaxMgDl } = useUserPreferences()
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
    () => buildDailyMoodGlucosePoints(range, entries, conversations, loc, "correlation"),
    [range, entries, conversations, loc]
  )

  const avgMgDl = useMemo(() => averageGlucoseMgDl(glucoseEntries), [glucoseEntries])
  const tir = useMemo(
    () => glucoseTirPercents(glucoseEntries, targetMinMgDl, targetMaxMgDl),
    [glucoseEntries, targetMinMgDl, targetMaxMgDl]
  )

  return (
    <AppShell title={t("pages.insights")} mainClassName="max-w-none w-full px-4 md:px-6 py-4 md:py-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <InsightsPeriodTabs value={timeRange} onValueChange={setTimeRange} />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}

        {!loading && (
          <>
            <InsightsTirHero avgMgDl={avgMgDl} tir={tir} />
            <InsightsGlucoseDailyCard chartPoints={chartPoints} overallAvgGlucose={avgMgDl} />
            <InsightsMoodRadarSection userId={userId} />
            <InsightsMoodGlucoseChart data={chartPoints} timeRange={timeRange} />
          </>
        )}
      </div>
    </AppShell>
  )
}
