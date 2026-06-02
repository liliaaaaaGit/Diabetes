"use client"

import { useCallback, useEffect, useState } from "react"
import type { DashboardStats } from "@/lib/types"

type StatsCacheItem = {
  data: DashboardStats
  ts: number
}

const DASHBOARD_STATS_CACHE_TTL_MS = 30_000
const dashboardStatsCache = new Map<string, StatsCacheItem>()

export function useDashboardStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setStats(null)
      setError(null)
      setLoading(false)
      return
    }
    const cached = dashboardStatsCache.get(userId)
    const isCachedFresh = !!cached && Date.now() - cached.ts < DASHBOARD_STATS_CACHE_TTL_MS

    if (isCachedFresh) {
      setStats(cached.data)
      setError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await fetch("/api/dashboard/stats", { credentials: "include" })
      if (!res.ok) {
        throw new Error("Failed to load dashboard stats")
      }
      const json = (await res.json()) as { stats?: DashboardStats }
      const nextStats = json.stats ?? null
      setStats(nextStats)
      if (nextStats) {
        dashboardStatsCache.set(userId, { data: nextStats, ts: Date.now() })
      }
    } catch (e) {
      if (!isCachedFresh) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard stats")
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { stats, loading, error, refetch }
}
