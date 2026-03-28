"use client"

import { useCallback, useEffect, useState } from "react"
import { getInsights } from "@/lib/db"
import type { Insight } from "@/lib/types"

export function useInsights(userId: string | null) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setInsights([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getInsights(userId)
      setInsights(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { insights, loading, error, refetch }
}
