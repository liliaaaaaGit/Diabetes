"use client"

import { useCallback, useEffect, useState } from "react"
import { getInsights } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import type { Insight } from "@/lib/types"

export function useInsights(userId: string = DEFAULT_USER_ID) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
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

