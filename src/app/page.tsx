"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Droplet, Activity, TrendingUp } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { GlucoseChart } from "@/components/dashboard/glucose-chart"
import { ManualEntryModal } from "@/components/logbook/manual-entry-modal"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useEntries } from "@/hooks/useEntries"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useUser } from "@/hooks/useUser"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { useGlucoseSafetyBanner } from "@/contexts/glucose-safety-context"
import { triggerGlucoseSafetyAfterSave } from "@/components/logbook/forms/glucose-form"
import { createEntry } from "@/lib/db-client"
import { scoreMoodTextClient } from "@/lib/mood-client"
import { getMoodLabel, resolveMoodDisplayNote } from "@/lib/mood"
import type { Entry, GlucoseContext, GlucoseEntry, MoodEntry } from "@/lib/types"
import { formatDistanceToNow, parseISO, subDays } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { glucoseTirPercents } from "@/lib/insights-aggregate"

/** Translate a glucose context code into a human-readable label. */
function getContextText(context: GlucoseContext, t: (k: string) => string): string {
  if (context === "fasting") return t("dashboard.fasting")
  if (context === "pre_meal") return t("dashboard.beforeMeal")
  if (context === "post_meal") return t("dashboard.afterMeal")
  if (context === "bedtime") return t("dashboard.bedtime")
  return t("dashboard.other")
}

/** A measurement is considered "stale" (no longer decision-relevant) after 4 hours. */
const STALE_HOURS = 4

/** Below this average number of measurements per day, TIR/average are flagged as sparse. */
const SPARSE_PER_DAY = 10

/** Hours within which a previous measurement is still comparable for a trend. */
const TREND_MAX_GAP_HOURS = 3

interface GlucoseTrend {
  arrow: string
  /** Tailwind text-color class for the arrow. */
  colorClass: string
  /** Translation key for the descriptive label. */
  labelKey: string
}

/**
 * Compare the most recent measurement with the previous one and derive a trend.
 * Returns null when there is no comparable previous reading (none at all, or the
 * previous one is older than TREND_MAX_GAP_HOURS so the comparison is meaningless).
 */
function computeGlucoseTrend(
  current: GlucoseEntry,
  previous?: GlucoseEntry
): GlucoseTrend | null {
  if (!previous) return null

  const currentMs = new Date(current.timestamp).getTime()
  const previousMs = new Date(previous.timestamp).getTime()
  const hoursApart = (currentMs - previousMs) / (1000 * 60 * 60)
  if (hoursApart < 0 || hoursApart > TREND_MAX_GAP_HOURS) return null

  // Values are stored in mg/dL, so the thresholds below are in mg/dL.
  const diff = current.value - previous.value
  if (diff > 15) return { arrow: "↑", colorClass: "text-red-600", labelKey: "dashboard.trendRising" }
  if (diff > 5) return { arrow: "↗", colorClass: "text-amber-600", labelKey: "dashboard.trendSlightlyRising" }
  if (diff >= -5) return { arrow: "→", colorClass: "text-emerald-600", labelKey: "dashboard.trendStable" }
  if (diff >= -15) return { arrow: "↘", colorClass: "text-emerald-600", labelKey: "dashboard.trendSlightlyFalling" }
  // A fast drop can also be dangerous, so it gets a warning color.
  return { arrow: "↓", colorClass: "text-amber-600", labelKey: "dashboard.trendFalling" }
}

function hoursSince(timestamp: string): number {
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60)
}

function MoodSummaryCard({ label, moodEntry }: { label: string; moodEntry?: MoodEntry }) {
  const { t } = useTranslation()
  const moodValue = moodEntry?.moodValue ?? 3
  const note = resolveMoodDisplayNote(moodEntry?.note, moodValue, t)

  return (
    <Card className="rounded-xl border-slate-100 shadow-sm bg-white">
      <CardContent className="p-3 sm:p-4">
        <p className="text-[11px] font-medium text-slate-600 sm:text-xs">{label}</p>
        <p className="mt-1 text-[15px] font-medium text-slate-900">{note}</p>
        <div className="mt-2 flex items-center gap-[3px]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full border ${idx < moodValue ? "border-[#1D9E75] bg-[#1D9E75]" : "border-gray-200 bg-transparent"}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * The big "Last Measurement" card. Shows the value with a trend arrow (Fix 5),
 * the meal context, and a clearly separated "time ago" line that turns orange
 * when the reading is stale (Fix 6).
 */
function LastMeasurementCard({
  entry,
  previousEntry,
}: {
  entry: GlucoseEntry
  previousEntry?: GlucoseEntry
}) {
  const { t, locale } = useTranslation()
  const { formatGlucoseWithUnit, unitSuffix } = useUserPreferences()

  const trend = computeGlucoseTrend(entry, previousEntry)
  const isStale = hoursSince(entry.timestamp) > STALE_HOURS

  const dateLocale = locale === "en" ? enUS : de
  let timeAgo = ""
  try {
    timeAgo = formatDistanceToNow(parseISO(entry.timestamp), {
      addSuffix: true,
      locale: dateLocale,
    })
  } catch {
    timeAgo = ""
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm bg-teal-50/50">
      <CardContent className="p-6">
        <p className="text-sm text-slate-600 mb-2">{t("dashboard.lastMeasurement")}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {formatGlucoseWithUnit(entry.value).value}
          </span>
          <span className="text-lg text-slate-600">{unitSuffix}</span>
          {trend && (
            <span className={`flex items-baseline gap-1 text-lg font-semibold ${trend.colorClass}`}>
              <span aria-hidden="true">{trend.arrow}</span>
              <span className="text-sm">{t(trend.labelKey)}</span>
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">{getContextText(entry.context, t)}</p>
        {timeAgo && (
          <p className={`text-[13px] mt-0.5 ${isStale ? "text-orange-500" : "text-gray-400"}`}>
            {timeAgo}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const { formatGlucoseWithUnit, unitSuffix, targetMinMgDl, targetMaxMgDl } = useUserPreferences()
  const { showGlucoseSafetyIfNeeded } = useGlucoseSafetyBanner()

  const [isModalOpen, setIsModalOpen] = useState(false)

  /** Load up to 1 year of glucose readings for the chart’s longest range. */
  const glucoseFetchFrom = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString()
  }, [])
  const nowIso = useMemo(() => new Date().toISOString(), [])

  const { stats, refetch: refetchStats } = useDashboardStats(userId)
  const { entries: glucoseEntries, loading: glucoseLoading, refetch: refetchGlucose } = useEntries(
    { type: "glucose", from: glucoseFetchFrom, to: nowIso },
    userId
  )
  const { entries: moodEntries, refetch: refetchMood } = useEntries(
    { type: "mood", limit: 1 },
    userId
  )
  const statsSafe =
    stats ?? ({ avgGlucose: 0, unit: "mg_dl", entriesToday: 0, timeInRange: 0 } as const)

  useEffect(() => {
    if (userId) void refetchStats()
  }, [targetMinMgDl, targetMaxMgDl, userId, refetchStats])

  const glucoseTyped = glucoseEntries as GlucoseEntry[]
  const moodTyped = moodEntries as MoodEntry[]

  const timeInRangePercent = useMemo(() => {
    const cutoff = subDays(new Date(), 7)
    const last7d = glucoseTyped.filter((e) => parseISO(e.timestamp) >= cutoff)
    return glucoseTirPercents(last7d, targetMinMgDl, targetMaxMgDl).inRange
  }, [glucoseTyped, targetMinMgDl, targetMaxMgDl])

  // Most recent two glucose readings (newest first), used for the trend arrow.
  const sortedGlucose = useMemo(() => {
    return [...glucoseTyped].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [glucoseTyped])
  const lastGlucoseEntry = sortedGlucose[0]
  const prevGlucoseEntry = sortedGlucose[1]

  // Number of measurements the 7-day average / TIR are based on. With finger-prick
  // data this is small, so we surface it (Fix 3) instead of implying CGM precision.
  const last7dCount = useMemo(() => {
    const cutoff = subDays(new Date(), 7)
    return glucoseTyped.filter((e) => parseISO(e.timestamp) >= cutoff).length
  }, [glucoseTyped])
  const isSparseData = last7dCount > 0 && last7dCount / 7 < SPARSE_PER_DAY

  const lastMoodEntry = moodTyped[0]

  const handleQuickLog = () => {
    setIsModalOpen(true)
  }

  const handleSaveEntry = async (entry: Entry) => {
    try {
      if (!userId) return
      let entryToSave: Entry = entry
      if (entry.type === "mood") {
        const note = (entry.note || "").trim()
        if (note) {
          const scoredMood = await scoreMoodTextClient(note)
          entryToSave = { ...entry, moodValue: scoredMood, note }
        } else {
          entryToSave = { ...entry, note: getMoodLabel(entry.moodValue, t) }
        }
      }
      await createEntry(userId, entryToSave)
      if (entryToSave.type === "glucose") {
        triggerGlucoseSafetyAfterSave(entryToSave, showGlucoseSafetyIfNeeded)
      }
      toast({
        title: t("logbook.entrySaved"),
        description: t("logbook.entrySavedSuccess"),
      })
      await Promise.all([refetchStats(), refetchGlucose(), refetchMood()])
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
            <LastMeasurementCard entry={lastGlucoseEntry} previousEntry={prevGlucoseEntry} />
          )}

          {/* Mobile stat cards: stacked on narrow screens */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              label={t("dashboard.avgGlucose")}
              value={formatGlucoseWithUnit(statsSafe.avgGlucose).value}
              unit={unitSuffix}
              icon={Droplet}
              color="teal"
              caption={last7dCount > 0 ? `n=${last7dCount}` : undefined}
              note={isSparseData ? t("dashboard.sparseDataHint") : undefined}
            />
            <StatCard
              label={t("dashboard.entriesToday")}
              value={statsSafe.entriesToday}
              icon={Activity}
              color="green"
            />
            <StatCard
              label={t("dashboard.timeInRange")}
              value={`${timeInRangePercent}%`}
              icon={TrendingUp}
              color="purple"
              caption={last7dCount > 0 ? `n=${last7dCount}` : undefined}
              note={isSparseData ? t("dashboard.sparseDataHint") : undefined}
            />
          </div>

          <div className="min-w-0">
            <MoodSummaryCard label={t("dashboard.moodToday")} moodEntry={lastMoodEntry} />
          </div>

          {!glucoseLoading && glucoseTyped.length === 0 ? (
            <p className="text-sm text-slate-500 px-1">{t("empty.dashboardNoGlucose")}</p>
          ) : null}

          {/* Glucose Chart */}
          <GlucoseChart entries={glucoseTyped} />

        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          {/* Left Column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* Last Measurement */}
            {lastGlucoseEntry && (
              <LastMeasurementCard entry={lastGlucoseEntry} previousEntry={prevGlucoseEntry} />
            )}

            {!glucoseLoading && glucoseTyped.length === 0 ? (
              <p className="text-sm text-slate-500 px-1">{t("empty.dashboardNoGlucose")}</p>
            ) : null}

            <GlucoseChart entries={glucoseTyped} />
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="space-y-4">
              <StatCard
                label={t("dashboard.avgGlucose")}
                value={formatGlucoseWithUnit(statsSafe.avgGlucose).value}
                unit={unitSuffix}
                icon={Droplet}
                color="teal"
                caption={last7dCount > 0 ? `n=${last7dCount}` : undefined}
                note={isSparseData ? t("dashboard.sparseDataHint") : undefined}
              />
              <StatCard
                label={t("dashboard.entriesToday")}
                value={statsSafe.entriesToday}
                icon={Activity}
                color="green"
              />
              <StatCard
                label={t("dashboard.timeInRange")}
                value={`${timeInRangePercent}%`}
                icon={TrendingUp}
                color="purple"
                caption={last7dCount > 0 ? `n=${last7dCount}` : undefined}
                note={isSparseData ? t("dashboard.sparseDataHint") : undefined}
              />
              <MoodSummaryCard label={t("dashboard.moodToday")} moodEntry={lastMoodEntry} />
            </div>

          </div>
        </div>
      </div>

      {/* Quick Log Button */}
      <Button
        onClick={handleQuickLog}
        size="icon"
        data-tour="add-entry"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6 md:h-16 md:w-16"
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
