"use client"

import { useCallback, useEffect, useState } from "react"
import { getGoals } from "@/lib/db"
import type { Goal } from "@/lib/types"

export function useGoals(userId: string | null) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setGoals([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getGoals(userId)
      setGoals(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { goals, loading, error, refetch }
}
