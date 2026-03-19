"use client"

import { useMemo, useState, useEffect } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { InsightCard } from "@/components/insights/insight-card"
import { GoalCard } from "@/components/insights/goal-card"
import { MotivationCard } from "@/components/insights/motivation-card"
import { MoodChart } from "@/components/insights/mood-chart"
import { MoodSummary } from "@/components/insights/mood-summary"
import { EmptyState } from "@/components/shared/empty-state"
import { Droplet, TrendingUp, Activity, Heart, MessageCircle } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useEntries } from "@/hooks/useEntries"
import { useInsights } from "@/hooks/useInsights"
import { useGoals } from "@/hooks/useGoals"
import { useConversations } from "@/hooks/useConversations"
import { dismissInsight, createInsight, createGoal } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { subDays, differenceInHours } from "date-fns"
import { getTimeInRange } from "@/lib/stats"
import type { GlucoseEntry, MoodEntry, Goal, Insight } from "@/lib/types"

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

function isWithinLastDays(iso: string, days: number) {
  const d = new Date(iso)
  const now = new Date()
  return d >= subDays(now, days)
}

export default function InsightsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [timeRange, setTimeRange] = useState<"week" | "7d" | "30d">("7d")
  const [isGenerating, setIsGenerating] = useState(false)
  const [motivationQuote, setMotivationQuote] = useState<{ quote: string; context: string } | null>(null)
  const days = timeRange === "week" ? 7 : timeRange === "7d" ? 7 : 30

  const toIso = useMemo(() => new Date().toISOString(), [])
  const fromIso = useMemo(() => subDays(new Date(), days).toISOString(), [days])

  const { entries, loading: entriesLoading, refetch: refetchEntries } = useEntries({ from: fromIso, to: toIso })
  const { insights, loading: insightsLoading, refetch: refetchInsights } = useInsights()
  const { goals, loading: goalsLoading, refetch: refetchGoals } = useGoals()
  const { conversations } = useConversations()

  const glucoseEntries = useMemo(() => entries.filter((e) => e.type === "glucose") as GlucoseEntry[], [entries])
  const moodEntries = useMemo(() => entries.filter((e) => e.type === "mood") as MoodEntry[], [entries])

  const avgGlucose = useMemo(() => {
    if (glucoseEntries.length === 0) return 0
    return Math.round((glucoseEntries.reduce((sum, e) => sum + e.value, 0) / glucoseEntries.length) * 10) / 10
  }, [glucoseEntries])

  const timeInRange = useMemo(() => {
    return getTimeInRange(glucoseEntries)
  }, [glucoseEntries])

  const avgMood = useMemo(() => {
    if (moodEntries.length === 0) return 3
    const sum = moodEntries.reduce((acc, e) => acc + e.moodValue, 0)
    return Math.round((sum / moodEntries.length) * 10) / 10
  }, [moodEntries])

  const glucoseDistribution = useMemo(() => {
    if (glucoseEntries.length === 0) return { under: 0, in: 0, over: 0 }
    const under = glucoseEntries.filter((e) => e.value < 70).length
    const inRange = glucoseEntries.filter((e) => e.value >= 70 && e.value <= 180).length
    const over = glucoseEntries.filter((e) => e.value > 180).length
    const total = glucoseEntries.length
    return {
      under: Math.round((under / total) * 100),
      in: Math.round((inRange / total) * 100),
      over: Math.round((over / total) * 100),
    }
  }, [glucoseEntries])

  // Check if insights are stale (older than 24 hours)
  const insightsAreStale = useMemo(() => {
    if (insights.length === 0) return true
    const newest = insights[0]
    const hoursSinceNewest = differenceInHours(new Date(), new Date(newest.createdAt))
    return hoursSinceNewest > 24
  }, [insights])

  // Generate insights on mount if stale
  useEffect(() => {
    if (insightsAreStale && !isGenerating && !insightsLoading) {
      void generateInsights()
    }
  }, [insightsAreStale, isGenerating, insightsLoading])

  // Load motivation from most recent insight
  useEffect(() => {
    const motivationInsight = insights.find((i) => i.type === "motivation" && !i.dismissed)
    if (motivationInsight) {
      setMotivationQuote({ quote: motivationInsight.title, context: motivationInsight.description })
    }
  }, [insights])

  const generateInsights = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEFAULT_USER_ID }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate insights")
      }

      const data = (await res.json()) as {
        patterns: Array<{ title: string; description: string; category: string; confidence?: number }>
        goals: Array<{ title: string; description: string; targetDays?: number }>
        motivation: { quote: string; context: string }
      }

      // Save patterns as insights
      for (const pattern of data.patterns) {
        await createInsight({
          userId: DEFAULT_USER_ID,
          type: "pattern",
          title: pattern.title,
          description: pattern.description,
          category: pattern.category,
        })
      }

      // Save goals
      for (const goal of data.goals) {
        await createGoal({
          userId: DEFAULT_USER_ID,
          title: goal.title,
          description: goal.description,
          targetDays: goal.targetDays ?? 7,
          active: true,
        })
      }

      // Save motivation as insight
      if (data.motivation.quote) {
        await createInsight({
          userId: DEFAULT_USER_ID,
          type: "motivation",
          title: data.motivation.quote,
          description: data.motivation.context,
          category: "general",
        })
        setMotivationQuote(data.motivation)
      }

      await refetchInsights()
      await refetchGoals()
    } catch (e) {
      console.error("Failed to generate insights:", e)
      toast({
        title: t("insights.generateFailed"),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefreshMotivation = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEFAULT_USER_ID }),
      })

      if (!res.ok) throw new Error("Failed to refresh motivation")

      const data = (await res.json()) as { motivation: { quote: string; context: string } }
      if (data.motivation.quote) {
        await createInsight({
          userId: DEFAULT_USER_ID,
          type: "motivation",
          title: data.motivation.quote,
          description: data.motivation.context,
          category: "general",
        })
        setMotivationQuote(data.motivation)
        await refetchInsights()
      }
    } catch (e) {
      toast({
        title: t("insights.refreshFailed"),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const activeInsights = useMemo(() => {
    return insights
      .filter((i) => !i.dismissed)
      .filter((i) => i.type === "pattern")
      .filter((i) => isWithinLastDays(i.createdAt, days))
  }, [insights, days])

  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.active).slice(0, 2)
  }, [goals])

  const handleDismissInsight = async (id: string) => {
    try {
      await dismissInsight(id)
      await refetchInsights()
    } catch (e) {
      toast({
        title: t("insights.dismiss"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    }
  }

  const handleGoalComplete = async () => {
    await refetchGoals()
  }

  // Check if we have enough data
  const endedConvs = conversations.filter((c) => !c.isActive)
  const hasEnoughData = endedConvs.length >= 3 && entries.length >= 10

  return (
    <AppShell title={t("pages.insights")}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{t("insights.title")}</h1>
          <p className="text-sm text-slate-600">{t("insights.subtitle")}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{insights.filter((i) => !i.dismissed).length}</div>
              <div className="text-xs text-slate-600 mt-1">{t("insights.totalInsights")}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{conversations.filter((c) => !c.isActive).length}</div>
              <div className="text-xs text-slate-600 mt-1">{t("insights.totalConversations")}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{activeGoals.length}</div>
              <div className="text-xs text-slate-600 mt-1">{t("insights.activeGoals")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "7d" | "30d")}>
          <TabsList>
            <TabsTrigger value="week">{t("insights.thisWeek")}</TabsTrigger>
            <TabsTrigger value="7d">{t("insights.last7Days")}</TabsTrigger>
            <TabsTrigger value="30d">{t("insights.last30Days")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label={t("insights.avgGlucose")} value={avgGlucose.toFixed(1)} unit={t("units.mgdl")} icon={Droplet} color="blue" />
          <StatCard label={t("insights.timeInRange")} value={`${timeInRange}%`} icon={TrendingUp} color="purple" />
          <StatCard label={t("insights.entries")} value={entries.length} icon={Activity} color="green" />
          <StatCard label={t("insights.avgMood")} value={moodEmojis[Math.round(avgMood)] || "😐"} icon={Heart} color="pink" />
        </div>

        {/* Glucose Distribution */}
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.underTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.under}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-300 rounded-full" style={{ width: `${glucoseDistribution.under}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.inTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.in}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${glucoseDistribution.in}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.overTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.over}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-800 rounded-full" style={{ width: `${glucoseDistribution.over}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.mood")}</h2>
              <MoodChart entries={moodEntries} days={days} />
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <MoodSummary entries={moodEntries} days={days} />
            </CardContent>
          </Card>
        </div>

        {/* Patterns Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.patterns")}</h2>
          {!hasEnoughData ? (
            <Card className="rounded-xl border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-slate-600">{t("insights.insufficientData")}</p>
              </CardContent>
            </Card>
          ) : activeInsights.length === 0 ? (
            <EmptyState icon={Droplet} title={t("empty.noInsights")} description={t("empty.noInsightsDesc")} />
          ) : (
            <div className="space-y-3">
              {activeInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onDismiss={handleDismissInsight} />
              ))}
            </div>
          )}
        </div>

        {/* Goals Section */}
        {hasEnoughData && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.goals")}</h2>
            {goalsLoading ? (
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardContent className="p-4">{t("common.loading")}</CardContent>
              </Card>
            ) : activeGoals.length === 0 ? (
              <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardContent className="p-4 text-center text-sm text-slate-600">{t("insights.noGoals")}</CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onComplete={handleGoalComplete} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Motivation Section */}
        {hasEnoughData && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.motivation")}</h2>
            {motivationQuote ? (
              <MotivationCard quote={motivationQuote.quote} context={motivationQuote.context} onRefresh={handleRefreshMotivation} />
            ) : (
              <Card className="rounded-xl border-slate-200 shadow-sm bg-amber-50/70">
                <CardContent className="p-4 text-center text-sm text-slate-600">{t("insights.noMotivation")}</CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Glucose Distribution */}
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.glucoseDistribution")}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.underTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.under}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-300 rounded-full" style={{ width: `${glucoseDistribution.under}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.inTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.in}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${glucoseDistribution.in}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{t("insights.overTarget")}</span>
                  <span className="font-semibold text-slate-900">{glucoseDistribution.over}%</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-800 rounded-full" style={{ width: `${glucoseDistribution.over}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("insights.mood")}</h2>
              <MoodChart entries={moodEntries} days={days} />
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <MoodSummary entries={moodEntries} days={days} />
            </CardContent>
          </Card>
        </div>

        {/* Loading guard */}
        {(entriesLoading || insightsLoading || isGenerating) && (
          <div className="text-sm text-slate-500 text-center">{t("common.loading")}</div>
        )}
      </div>
    </AppShell>
  )
}
