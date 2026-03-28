"use client"

import { useMemo, useState } from "react"
import { Plus, Droplet, Activity, TrendingUp, Heart } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { GlucoseChart } from "@/components/dashboard/glucose-chart"
import { DailyInsightCard } from "@/components/dashboard/daily-insight-card"
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed"
import { ManualEntryModal } from "@/components/logbook/manual-entry-modal"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useEntries } from "@/hooks/useEntries"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useInsights } from "@/hooks/useInsights"
import { useUser } from "@/hooks/useUser"
import { createEntry } from "@/lib/db"
import type { Entry, GlucoseEntry, MoodEntry, GlucoseUnit } from "@/lib/types"
import { formatDistanceToNow, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()

  const unit: GlucoseUnit = "mg_dl"
  const [isModalOpen, setIsModalOpen] = useState(false)

  const start14d = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString()
  }, [])

  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats(userId)
  const { entries: glucoseEntries, loading: glucoseLoading, refetch: refetchGlucose } = useEntries(
    { type: "glucose", from: start14d },
    userId
  )
  const { entries: moodEntries, loading: moodLoading, refetch: refetchMood } = useEntries(
    { type: "mood", limit: 1 },
    userId
  )
  const { entries: recentEntries, loading: recentLoading, refetch: refetchRecent } = useEntries(
    { limit: 8 },
    userId
  )
  const { insights, loading: insightsLoading, refetch: refetchInsights } = useInsights(userId)

  const statsSafe =
    stats ?? ({ avgGlucose: 0, unit: "mg_dl", entriesToday: 0, timeInRange: 0 } as const)

  const glucoseTyped = glucoseEntries as GlucoseEntry[]
  const moodTyped = moodEntries as MoodEntry[]

  const lastGlucoseEntry = useMemo(() => {
    return [...glucoseTyped]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }, [glucoseTyped])

  const lastMoodEntry = moodTyped[0]

  const todayInsight = useMemo(() => {
    // Prefer motivation insights (quotes) for the dashboard
    const motivationInsight = insights.find((i) => i.type === "motivation" && !i.dismissed)
    if (motivationInsight) return motivationInsight
    
    // Fallback to any active insight
    const active = insights.find((i) => !i.dismissed)
    return active ?? insights[0]
  }, [insights])

  const showDashboardInsightPlaceholder = !insightsLoading && !todayInsight

  const getContextText = (context: string) => {
    if (context === "fasting") return t("dashboard.fasting")
    if (context === "pre_meal") return t("dashboard.beforeMeal")
    if (context === "post_meal") return t("dashboard.afterMeal")
    if (context === "bedtime") return t("dashboard.bedtime")
    return t("dashboard.other")
  }

  const getRelativeTime = (timestamp: string): string => {
    try {
      const date = parseISO(timestamp)
      const distance = formatDistanceToNow(date, { addSuffix: true, locale: de })
      return distance.replace(/^vor /, "").replace(/^in /, "")
    } catch {
      return ""
    }
  }

  const handleQuickLog = () => {
    setIsModalOpen(true)
  }

  const handleSaveEntry = async (entry: Entry) => {
    try {
      if (!userId) return
      await createEntry(userId, entry)
      toast({
        title: t("logbook.entrySaved"),
        description: t("logbook.entrySavedSuccess"),
      })
      await Promise.all([
        refetchStats(),
        refetchGlucose(),
        refetchMood(),
        refetchRecent(),
        refetchInsights(),
      ])
    } catch (e) {
      toast({
        title: t("logbook.entrySaved"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    }
  }

  return (
    <AppShell title={t("pages.dashboard")}>
      <div className="space-y-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-6">
          {/* Last Measurement */}
          {lastGlucoseEntry && (
            <Card className="rounded-xl border-slate-200 shadow-sm bg-blue-50/50">
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-2">{t("dashboard.lastMeasurement")}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{lastGlucoseEntry.value}</span>
                  <span className="text-lg text-slate-600">{t("units.mgdl")}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {getContextText(lastGlucoseEntry.context)} • {getRelativeTime(lastGlucoseEntry.timestamp)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards - Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex-shrink-0 w-[160px]">
              <StatCard
                label={t("dashboard.avgGlucose")}
                value={statsSafe.avgGlucose.toFixed(1)}
                unit={t("units.mgdl")}
                icon={Droplet}
                color="blue"
              />
            </div>
            <div className="flex-shrink-0 w-[160px]">
              <StatCard
                label={t("dashboard.entriesToday")}
                value={statsSafe.entriesToday}
                icon={Activity}
                color="green"
              />
            </div>
            <div className="flex-shrink-0 w-[160px]">
              <StatCard
                label={t("dashboard.timeInRange")}
                value={`${statsSafe.timeInRange}%`}
                icon={TrendingUp}
                color="purple"
              />
            </div>
            <div className="flex-shrink-0 w-[160px]">
              <StatCard
                label={t("dashboard.moodToday")}
                value={lastMoodEntry ? moodEmojis[lastMoodEntry.moodValue] : "😐"}
                icon={Heart}
                color="pink"
              />
            </div>
          </div>

          {!glucoseLoading && glucoseTyped.length === 0 ? (
            <p className="text-sm text-slate-500 px-1">{t("empty.dashboardNoGlucose")}</p>
          ) : null}

          {/* Glucose Chart */}
          <GlucoseChart entries={glucoseTyped} />

          {/* Daily Insight */}
          {todayInsight ? (
            <DailyInsightCard insight={todayInsight} />
          ) : showDashboardInsightPlaceholder ? (
            <Card className="rounded-xl border-slate-200 bg-slate-50/90 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">{t("empty.dashboardNoInsight")}</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Recent Activity */}
          <RecentActivityFeed entries={recentEntries} limit={8} />
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          {/* Left Column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* Last Measurement */}
            {lastGlucoseEntry && (
              <Card className="rounded-xl border-slate-200 shadow-sm bg-blue-50/50">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-2">{t("dashboard.lastMeasurement")}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-slate-900">{lastGlucoseEntry.value}</span>
                    <span className="text-lg text-slate-600">{t("units.mgdl")}</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {getContextText(lastGlucoseEntry.context)} • {getRelativeTime(lastGlucoseEntry.timestamp)}
                  </p>
                </CardContent>
              </Card>
            )}

            {!glucoseLoading && glucoseTyped.length === 0 ? (
              <p className="text-sm text-slate-500 px-1">{t("empty.dashboardNoGlucose")}</p>
            ) : null}

            <GlucoseChart entries={glucoseTyped} />
            <RecentActivityFeed entries={recentEntries} limit={8} />
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="space-y-4">
              <StatCard
                label={t("dashboard.avgGlucose")}
                value={statsSafe.avgGlucose.toFixed(1)}
                unit={t("units.mgdl")}
                icon={Droplet}
                color="blue"
              />
              <StatCard
                label={t("dashboard.entriesToday")}
                value={statsSafe.entriesToday}
                icon={Activity}
                color="green"
              />
              <StatCard
                label={t("dashboard.timeInRange")}
                value={`${statsSafe.timeInRange}%`}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                label={t("dashboard.moodToday")}
                value={lastMoodEntry ? moodEmojis[lastMoodEntry.moodValue] : "😐"}
                icon={Heart}
                color="pink"
              />
            </div>

            {/* Daily Insight */}
            {todayInsight ? (
              <DailyInsightCard insight={todayInsight} />
            ) : showDashboardInsightPlaceholder ? (
              <Card className="rounded-xl border-slate-200 bg-slate-50/90 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600">{t("empty.dashboardNoInsight")}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Log Button */}
      <Button
        onClick={handleQuickLog}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:h-16 md:w-16"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
      </Button>

      <ManualEntryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
      />
    </AppShell>
  )
}
