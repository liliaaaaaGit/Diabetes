"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Smile } from "lucide-react"
import { getEmotionAverages } from "@/lib/db-client"
import type { ConversationEmotions } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"

const BuddyMoodRadar = dynamic(
  () => import("@/components/buddy/buddy-mood-radar").then((m) => m.BuddyMoodRadar),
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

interface InsightsMoodRadarSectionProps {
  userId: string | null
}

/** Same mood radar as Buddy → Statistik (conversation emotion averages). */
export function InsightsMoodRadarSection({ userId }: InsightsMoodRadarSectionProps) {
  const { t } = useTranslation()
  const [moodLoading, setMoodLoading] = useState(true)
  const [averages, setAverages] = useState<ConversationEmotions | null>(null)

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
        if (!cancelled) setAverages(emotionAvg)
      } catch {
        if (!cancelled) setAverages(null)
      } finally {
        if (!cancelled) setMoodLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

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
          <BuddyMoodRadar data={radarData} chartLabel={t("buddy.mood.chartName")} />
        )}
      </div>
    </section>
  )
}
