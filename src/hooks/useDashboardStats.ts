"use client"

import { useCallback, useEffect, useState } from "react"
import { getDashboardStats } from "@/lib/db"
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
      const data = await getDashboardStats(userId)
      setStats(data)
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
