"use client"

import { useCallback, useEffect, useState } from "react"
import { getEntries } from "@/lib/db"
import type { Entry, EntryType } from "@/lib/types"
import { DEFAULT_USER_ID } from "@/lib/constants"

export type EntriesFilters = {
  type?: EntryType
  from?: string
  to?: string
  limit?: number
}

export function useEntries(filters?: EntriesFilters, userId: string = DEFAULT_USER_ID) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEntries(
        userId,
        // DEFAULT to "all types" when no filter.type is provided
        filters?.type
          ? {
              type: filters.type,
              from: filters.from,
              to: filters.to,
              limit: filters.limit,
            }
          : filters
      )
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entries")
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters ?? {})])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}

