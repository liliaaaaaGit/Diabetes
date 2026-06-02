"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, startOfWeek } from "date-fns"
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

/** Drop cached week/day queries so a save + refetch always hits the API. */
export function invalidateEntriesCacheForUser(userId: string) {
  for (const key of entriesCache.keys()) {
    if (key.startsWith(`${userId}:`)) entriesCache.delete(key)
  }
}

/** Monday-start week range containing `day` (matches logbook calendar). */
export function weekFiltersForDate(day: Date): EntriesFilters {
  const weekStart = startOfWeek(day, { weekStartsOn: 1 })
  return {
    from: weekStart.toISOString(),
    to: addDays(weekStart, 7).toISOString(),
  }
}

async function fetchEntriesFromApi(filters: EntriesFilters): Promise<Entry[]> {
  const params = new URLSearchParams()
  if (filters.type) params.set("type", filters.type)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.limit != null) params.set("limit", String(filters.limit))
  const query = params.toString()
  const res = await fetch(`/api/entries${query ? `?${query}` : ""}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error("Failed to load entries")
  const json = (await res.json()) as { entries?: Entry[] }
  return Array.isArray(json.entries) ? json.entries : []
}

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

    const hadFreshCache = isCachedFresh

    try {
      const parsed = JSON.parse(filtersKey) as EntriesFilters
      const nextEntries = await fetchEntriesFromApi(parsed)
      setEntries(nextEntries)
      entriesCache.set(cacheKey, { data: nextEntries, ts: Date.now() })
    } catch (e) {
      // Keep cached data visible if available; only show error when no cached fallback exists.
      if (!hadFreshCache) {
        setError(e instanceof Error ? e.message : "Failed to load entries")
      }
    } finally {
      setLoading(false)
    }
  }, [userId, filtersKey, cacheKey])

  useEffect(() => {
    void refetch()
  }, [refetch])

  /** Reload the week that contains `day` (use after AI save — avoids stale refetch closure). */
  const refetchForDay = useCallback(
    async (day: Date) => {
      if (!userId) {
        setEntries([])
        setError(null)
        setLoading(false)
        return
      }

      const dayFilters = weekFiltersForDate(day)
      const dayCacheKey = `${userId}:${JSON.stringify(dayFilters)}`

      setLoading(true)
      setError(null)

      try {
        const nextEntries = await fetchEntriesFromApi(dayFilters)
        setEntries(nextEntries)
        entriesCache.set(dayCacheKey, { data: nextEntries, ts: Date.now() })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load entries")
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  return { entries, loading, error, refetch, refetchForDay }
}
