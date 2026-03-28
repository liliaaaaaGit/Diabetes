"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getEntries } from "@/lib/db"
import type { Entry, EntryType } from "@/lib/types"

export type EntriesFilters = {
  type?: EntryType
  from?: string
  to?: string
  limit?: number
}

export function useEntries(filters?: EntriesFilters, userId: string | null = null) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const refetch = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const parsed = JSON.parse(filtersKey) as EntriesFilters
      const hasKeys = Object.keys(parsed).length > 0
      const filterArg = !hasKeys
        ? undefined
        : parsed.type
          ? { type: parsed.type, from: parsed.from, to: parsed.to, limit: parsed.limit }
          : parsed
      const data = await getEntries(userId, filterArg)
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entries")
    } finally {
      setLoading(false)
    }
  }, [userId, filtersKey])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
