"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { addDays, startOfWeek } from "date-fns"
import { dayFiltersForDate } from "@/lib/entry-day"
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
  const fetchGenRef = useRef(0)

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const cacheKey = useMemo(() => `${userId ?? "anon"}:${filtersKey}`, [userId, filtersKey])

  const applyEntries = useCallback(
    (nextEntries: Entry[], gen: number) => {
      if (gen !== fetchGenRef.current) return
      setEntries(nextEntries)
      if (userId) {
        entriesCache.set(cacheKey, { data: nextEntries, ts: Date.now() })
      }
    },
    [cacheKey, userId]
  )

  const refetch = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setError(null)
      setLoading(false)
      return
    }

    const gen = ++fetchGenRef.current
    const cached = entriesCache.get(cacheKey)
    const isCachedFresh =
      !!cached && Date.now() - cached.ts < ENTRIES_CACHE_TTL_MS

    if (isCachedFresh) {
      applyEntries(cached.data, gen)
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
      applyEntries(nextEntries, gen)
      setError(null)
    } catch (e) {
      if (gen !== fetchGenRef.current) return
      if (!hadFreshCache) {
        setError(e instanceof Error ? e.message : "Failed to load entries")
      }
    } finally {
      if (gen === fetchGenRef.current) {
        setLoading(false)
      }
    }
  }, [userId, filtersKey, cacheKey, applyEntries])

  useEffect(() => {
    void refetch()
  }, [refetch])

  /** Reload entries for one local calendar day (use after AI save). */
  const refetchForDay = useCallback(
    async (day: Date) => {
      if (!userId) {
        setEntries([])
        setError(null)
        setLoading(false)
        return
      }

      const dayFilters = dayFiltersForDate(day)
      const dayCacheKey = `${userId}:${JSON.stringify(dayFilters)}`
      const gen = ++fetchGenRef.current

      setLoading(true)
      setError(null)

      try {
        const nextEntries = await fetchEntriesFromApi(dayFilters)
        applyEntries(nextEntries, gen)
        setError(null)
        entriesCache.set(dayCacheKey, { data: nextEntries, ts: Date.now() })
      } catch (e) {
        if (gen !== fetchGenRef.current) return
        setError(e instanceof Error ? e.message : "Failed to load entries")
      } finally {
        if (gen === fetchGenRef.current) {
          setLoading(false)
        }
      }
    },
    [userId, applyEntries]
  )

  /** Immediately show entries returned from createEntry (before refetch completes). */
  const mergeEntries = useCallback((incoming: Entry[]) => {
    if (incoming.length === 0) return
    setEntries((prev) => {
      const byId = new Map(prev.map((e) => [e.id, e]))
      for (const e of incoming) {
        byId.set(e.id, e)
      }
      return [...byId.values()].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    })
  }, [])

  return { entries, loading, error, refetch, refetchForDay, mergeEntries }
}
