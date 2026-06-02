"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Entry, EntryType } from "@/lib/types"

export type EntriesFilters = {
  type?: EntryType
  from?: string
  to?: string
  limit?: number
}

type EntriesCacheItem = {
  data: Entry[]
  ts: number
}

const ENTRIES_CACHE_TTL_MS = 30_000
const entriesCache = new Map<string, EntriesCacheItem>()

export function useEntries(filters?: EntriesFilters, userId: string | null = null) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const cacheKey = useMemo(() => `${userId ?? "anon"}:${filtersKey}`, [userId, filtersKey])

  const refetch = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setError(null)
      setLoading(false)
      return
    }

    const cached = entriesCache.get(cacheKey)
    const isCachedFresh =
      !!cached && Date.now() - cached.ts < ENTRIES_CACHE_TTL_MS

    // Fast path on page switches/reloads: show recent data immediately.
    if (isCachedFresh) {
      setEntries(cached.data)
      setError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setError(null)
    }

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
      const nextEntries = Array.isArray(json.entries) ? json.entries : []
      setEntries(nextEntries)
      entriesCache.set(cacheKey, { data: nextEntries, ts: Date.now() })
    } catch (e) {
      // Keep cached data visible if available; only show error when no cached fallback exists.
      if (!isCachedFresh) {
        setError(e instanceof Error ? e.message : "Failed to load entries")
      }
    } finally {
      setLoading(false)
    }
  }, [userId, filtersKey, cacheKey])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
