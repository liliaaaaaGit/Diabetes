"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Smile } from "lucide-react"
import { getEmotionAverages } from "@/lib/db"
import type { ConversationEmotions } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"
import { DailyGoals, type BuddyDailyGoal } from "@/components/buddy/daily-goals"
import { MotivationQuote } from "@/components/buddy/motivation-quote"

const BuddyMoodRadar = dynamic(
  () => import("./buddy-mood-radar").then((m) => m.BuddyMoodRadar),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-teal-50/50" />,
  }
)

const EMOTION_KEYS: (keyof ConversationEmotions)[] = [
  "happiness",
  "surprise",
  "sadness",
  "anger",
  "fear",
  "disgust",
]

export function BuddyStats({
  userId,
  refreshKey = 0,
  dailyRefreshNonce = 0,
}: {
  userId: string | null
  refreshKey?: number
  /** Bumps when Buddy overview daily cache (motivation/goals) should reload. */
  dailyRefreshNonce?: number
}) {
  const { t } = useTranslation()
  const [moodLoading, setMoodLoading] = useState(true)
  const [averages, setAverages] = useState<ConversationEmotions | null>(null)

  const [motivationQuote, setMotivationQuote] = useState(
    "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
  )
  const [dailyGoals, setDailyGoals] = useState<BuddyDailyGoal[]>([])
  const [dailyLoading, setDailyLoading] = useState(true)
  const [refreshingQuote, setRefreshingQuote] = useState(false)

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const cacheKey = useCallback(
    (name: string) => `buddy_${userId ?? "none"}_${name}_${todayKey}`,
    [userId, todayKey]
  )

  useEffect(() => {
    if (!userId) {
      setDailyLoading(false)
      return
    }
    const loadDaily = async () => {
      setDailyLoading(true)
      try {
        const loadMotivation = async () => {
          const cached = localStorage.getItem(cacheKey("motivation"))
          if (cached) return cached
          const res = await fetch("/api/buddy/motivation", { credentials: "include" })
          if (!res.ok) return "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
          const json = (await res.json()) as { quote?: string }
          const value = json.quote || "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
          localStorage.setItem(cacheKey("motivation"), value)
          return value
        }

        const loadGoals = async () => {
          const cached = localStorage.getItem(cacheKey("goals"))
          if (cached) {
            try {
              return JSON.parse(cached) as BuddyDailyGoal[]
            } catch {
              // ignore
            }
          }
          const res = await fetch("/api/buddy/goals", { credentials: "include" })
          if (!res.ok) {
            return [
              { id: "f-1", text: "Nenne heute einen kleinen Erfolg.", completed: false },
              { id: "f-2", text: "Atme 3 Mal bewusst tief ein.", completed: false },
              { id: "f-3", text: "Schreib auf, was dir gut tat.", completed: false },
            ] satisfies BuddyDailyGoal[]
          }
          const json = (await res.json()) as { goals?: BuddyDailyGoal[] }
          const value = (json.goals || []).slice(0, 3)
          localStorage.setItem(cacheKey("goals"), JSON.stringify(value))
          return value
        }

        const [quote, goals] = await Promise.all([loadMotivation(), loadGoals()])
        setMotivationQuote(quote)
        setDailyGoals(goals)
      } finally {
        setDailyLoading(false)
      }
    }

    void loadDaily()
  }, [cacheKey, todayKey, userId, refreshKey, dailyRefreshNonce])

  const handleToggleGoal = async (goal: BuddyDailyGoal) => {
    const updated = dailyGoals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g))
    setDailyGoals(updated)
    localStorage.setItem(cacheKey("goals"), JSON.stringify(updated))
    if (goal.id.startsWith("fallback")) return
    try {
      await fetch("/api/buddy/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ goalId: goal.id, completed: !goal.completed }),
      })
    } catch {
      // keep optimistic state
    }
  }

  const handleRefreshMotivation = async () => {
    setRefreshingQuote(true)
    try {
      localStorage.removeItem(cacheKey("motivation"))
      const res = await fetch("/api/buddy/motivation", { credentials: "include" })
      if (!res.ok) return
      const json = (await res.json()) as { quote?: string }
      const quote = json.quote || "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
      setMotivationQuote(quote)
      localStorage.setItem(cacheKey("motivation"), quote)
    } finally {
      setRefreshingQuote(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setMoodLoading(false)
      setAverages(null)
      return
    }

    let cancelled = false
    setMoodLoading(true)
    void (async () => {
      try {
        const emotionAvg = await getEmotionAverages(userId)
        if (cancelled) return
        setAverages(emotionAvg)
      } catch {
        if (!cancelled) setAverages(null)
      } finally {
        if (!cancelled) setMoodLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  const radarData = useMemo(() => {
    if (!averages) return []
    return EMOTION_KEYS.map((key) => ({
      subject: t(`buddy.mood.axes.${key}`),
      value: Math.round(averages[key] * 1000) / 1000,
    }))
  }, [averages, t])

  if (!userId) {
    return (
      <p className="text-center text-sm text-slate-500">{t("buddy.stats.signInHint")}</p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6 lg:px-8">
      {dailyLoading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-xl bg-teal-500/10" />
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-teal-50/80" />
            <div className="h-16 animate-pulse rounded-xl bg-teal-50/80" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <MotivationQuote
            variant="teal"
            quote={motivationQuote}
            onRefresh={handleRefreshMotivation}
            loading={refreshingQuote}
          />
          <DailyGoals goals={dailyGoals} onToggle={handleToggleGoal} />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Smile className="h-5 w-5 text-teal-600" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t("buddy.mood.listTitle")}</h2>
        </div>
        <div className="rounded-xl border border-teal-500/15 bg-white p-4 shadow-sm ring-1 ring-teal-500/10">
          {!moodLoading && averages == null ? (
            <p className="py-12 text-center text-sm leading-relaxed text-slate-600">{t("buddy.mood.empty")}</p>
          ) : moodLoading ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-teal-50/50" />
          ) : (
            <BuddyMoodRadar data={radarData} />
          )}
        </div>
      </section>
    </div>
  )
}
