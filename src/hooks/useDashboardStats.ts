"use client"

import { useCallback, useEffect, useState } from "react"
import type { DashboardStats } from "@/lib/types"

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
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dashboard/stats", { credentials: "include" })
      if (!res.ok) {
        throw new Error("Failed to load dashboard stats")
      }
      const json = (await res.json()) as { stats?: DashboardStats }
      setStats(json.stats ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard stats")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { stats, loading, error, refetch }
}
