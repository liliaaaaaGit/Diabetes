"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Clock, Smile } from "lucide-react"
import { getBuddyStatsTotals, getEmotionAverages } from "@/lib/db"
import type { ConversationEmotions } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"

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

export function BuddyStats({ userId, refreshKey = 0 }: { userId: string | null; refreshKey?: number }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [convosCompleted, setConvosCompleted] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [averages, setAverages] = useState<ConversationEmotions | null>(null)

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
    <div className="mx-auto w-full max-w-xl space-y-8 p-4 md:p-6">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" aria-hidden />
          <h2 className="text-lg font-bold lowercase tracking-tight text-slate-900">{t("buddy.stats.listTitle")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
