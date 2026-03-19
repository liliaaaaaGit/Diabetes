"use client"

import { useEffect, useState } from "react"
import { getConversationStats } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { useTranslation } from "@/hooks/useTranslation"

interface HistoryStatsProps {
  refreshKey?: number
}

export function HistoryStats({ refreshKey = 0 }: HistoryStatsProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, avgLength: 0 })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await getConversationStats(DEFAULT_USER_ID)
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setStats({ total: 0, thisMonth: 0, avgLength: 0 })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[11px] leading-tight text-slate-500 md:text-sm">{t("buddy.history.total")}</p>
        <p className="mt-1 text-xl font-semibold text-teal-600">{stats.total}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[11px] leading-tight text-slate-500 md:text-sm">{t("buddy.history.thisMonth")}</p>
        <p className="mt-1 text-xl font-semibold text-blue-600">{stats.thisMonth}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[11px] leading-tight text-slate-500 md:text-sm">{t("buddy.history.avgLength")}</p>
        <p className="mt-1 text-xl font-semibold text-purple-600">{stats.avgLength}</p>
        <p className="text-[10px] text-slate-500 md:text-xs">{t("buddy.history.messages")}</p>
      </div>
    </div>
  )
}
