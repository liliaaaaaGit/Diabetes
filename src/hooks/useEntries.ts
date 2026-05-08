"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
      const params = new URLSearchParams()
      if (parsed.type) params.set("type", parsed.type)
      if (parsed.from) params.set("from", parsed.from)
      if (parsed.to) params.set("to", parsed.to)
      if (parsed.limit != null) params.set("limit", String(parsed.limit))
      const query = params.toString()

      const res = await fetch(`/api/entries${query ? `?${query}` : ""}`, {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error("Failed to load entries")
      }
      const json = (await res.json()) as { entries?: Entry[] }
      setEntries(Array.isArray(json.entries) ? json.entries : [])
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
