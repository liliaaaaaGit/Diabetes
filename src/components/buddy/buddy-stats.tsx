"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Clock, Smile } from "lucide-react"
import { getBuddyStatsTotals, getEmotionAverages } from "@/lib/db"
import type { ConversationEmotions } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"
import { DailyImpulseCard } from "@/components/buddy/daily-impulse-card"
import { DailyGoals, type BuddyDailyGoal } from "@/components/buddy/daily-goals"
import { MotivationQuote } from "@/components/buddy/motivation-quote"

const BuddyMoodRadar = dynamic(
  () => import("./buddy-mood-radar").then((m) => m.BuddyMoodRadar),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-amber-50/40" />,
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
  /** Bumps when Buddy overview daily cache (impulse/motivation) should reload. */
  dailyRefreshNonce?: number
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [convosCompleted, setConvosCompleted] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [averages, setAverages] = useState<ConversationEmotions | null>(null)

  const [impulseText, setImpulseText] = useState(
    "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
  )
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return t("buddy.goodMorning")
    if (hour < 18) return t("buddy.goodAfternoon")
    return t("buddy.goodEvening")
  }

  useEffect(() => {
    if (!userId) {
      setDailyLoading(false)
      return
    }
    const loadDaily = async () => {
      setDailyLoading(true)
      try {
        const loadImpulse = async () => {
          const cached = localStorage.getItem(cacheKey("impulse"))
          if (cached) return cached
          const res = await fetch("/api/buddy/impulse", { credentials: "include" })
          if (!res.ok) return "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          const json = (await res.json()) as { impulse?: string }
          const value = json.impulse || "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          localStorage.setItem(cacheKey("impulse"), value)
          return value
        }

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

        const [impulse, quote, goals] = await Promise.all([loadImpulse(), loadMotivation(), loadGoals()])
        setImpulseText(impulse)
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
      setLoading(false)
      setConvosCompleted(0)
      setTotalMessages(0)
      setAverages(null)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const [totals, emotionAvg] = await Promise.all([
          getBuddyStatsTotals(userId),
          getEmotionAverages(userId),
        ])
        if (cancelled) return
        setConvosCompleted(totals.convosCompleted)
        setTotalMessages(totals.totalMessages)
        setAverages(emotionAvg)
      } catch {
        if (!cancelled) {
          setConvosCompleted(0)
          setTotalMessages(0)
          setAverages(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
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
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-6 lg:px-8">
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-800">{t("buddy.stats.dailySection")}</h2>
        {dailyLoading ? (
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <DailyImpulseCard impulseText={impulseText} greeting={getGreeting()} showChatButton={false} />
            <MotivationQuote quote={motivationQuote} onRefresh={handleRefreshMotivation} loading={refreshingQuote} />
            <DailyGoals goals={dailyGoals} onToggle={handleToggleGoal} />
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" aria-hidden />
          <h2 className="text-lg font-bold lowercase tracking-tight text-slate-900">{t("buddy.stats.listTitle")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium lowercase text-slate-500">{t("buddy.stats.convosCompleted")}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {loading ? "—" : convosCompleted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium lowercase text-slate-500">{t("buddy.stats.messages")}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {loading ? "—" : totalMessages}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Smile className="h-5 w-5 text-slate-600" aria-hidden />
          <h2 className="text-lg font-bold lowercase tracking-tight text-slate-900">{t("buddy.mood.listTitle")}</h2>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          {!loading && averages == null ? (
            <p className="py-12 text-center text-sm leading-relaxed text-slate-600">{t("buddy.mood.empty")}</p>
          ) : loading ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-amber-50/30" />
          ) : (
            <BuddyMoodRadar data={radarData} />
          )}
        </div>
      </section>
    </div>
  )
}
