"use client"

import { useMemo } from "react"
import type { Entry, EntryType } from "@/lib/types"
import { parseISO } from "date-fns"
import { LogbookUnifiedEntryCard } from "./logbook-unified-entry-card"
import { isLogbookEvent } from "@/lib/cgm"

/** Entries this close together (minutes) belong to the same "moment". */
const GROUP_WINDOW_MINUTES = 90
/** A follow-up BG after a meal is expected roughly 1.5–3.5 h later. */
const FOLLOWUP_MIN_MINUTES = 90
const FOLLOWUP_MAX_MINUTES = 210

const ts = (e: Entry) => parseISO(e.timestamp).getTime()

/**
 * Group the day's entries into cards.
 *
 * 1. Consecutive non-mood entries within 90 min form one "moment" card.
 * 2. Mood entries are always their own card.
 * 3. A lone BG measured 90–210 min after a meal gets pulled into that meal's
 *    card as the "follow-up" reading (so a meal + bolus + later BG show as one
 *    connected episode).
 */
function buildGroups(entries: Entry[]): Entry[][] {
  if (entries.length === 0) return []

  const sorted = [...entries].sort((a, b) => ts(a) - ts(b))

  // Step 1: base clusters by proximity (mood always standalone).
  const clusters: Entry[][] = []
  let current: Entry[] = []
  let groupStartTime = 0

  for (const entry of sorted) {
    if (entry.type === "mood") {
      if (current.length > 0) {
        clusters.push(current)
        current = []
      }
      clusters.push([entry])
      continue
    }

    if (current.length === 0) {
      current = [entry]
      groupStartTime = ts(entry)
      continue
    }

    if ((ts(entry) - groupStartTime) / 60000 <= GROUP_WINDOW_MINUTES) {
      current.push(entry)
      continue
    }

    clusters.push(current)
    current = [entry]
    groupStartTime = ts(entry)
  }
  if (current.length > 0) clusters.push(current)

  // Step 2: attach a lone follow-up BG to the matching meal cluster.
  const mealClusters = clusters.filter((c) => c.some((e) => e.type === "meal"))
  const consumed = new Set<Entry[]>()

  for (const mealCluster of mealClusters) {
    const mealTimes = mealCluster
      .filter((e) => e.type === "meal")
      .map((e) => ts(e))
    const mealTime = Math.min(...mealTimes)

    for (const candidate of clusters) {
      if (candidate === mealCluster || consumed.has(candidate)) continue
      // Only a standalone single glucose reading qualifies as a follow-up.
      if (candidate.length === 1 && candidate[0].type === "glucose") {
        const diffMin = (ts(candidate[0]) - mealTime) / 60000
        if (diffMin >= FOLLOWUP_MIN_MINUTES && diffMin <= FOLLOWUP_MAX_MINUTES) {
          mealCluster.push(candidate[0])
          consumed.add(candidate)
          break
        }
      }
    }
  }

  return clusters.filter((c) => !consumed.has(c))
}

interface EntryListProps {
  entries: Entry[]
  filter: EntryType | "all"
  onMealUpdated?: () => void
}

export function EntryList({ entries, filter, onMealUpdated }: EntryListProps) {
  // The continuous CGM stream lives in the chart, not the list. We group only
  // "events" (meals, insulin, activity, mood, manual fingersticks). The full
  // set (incl. CGM) is still handed to each card so meal episodes can read the
  // pre-meal and ~2h postprandial values from the stream.
  const groupedEntries = useMemo(
    () => buildGroups(entries.filter(isLogbookEvent)).reverse(),
    [entries]
  )

  const events = useMemo(() => entries.filter(isLogbookEvent), [entries])

  const visibleGroups = useMemo(() => {
    if (filter === "all") return groupedEntries

    return groupedEntries
      .map((group) => group.filter((entry) => entry.type === filter))
      .filter((group) => group.length > 0)
  }, [filter, groupedEntries])

  if (visibleGroups.length === 0 && events.length > 0) {
    const flat =
      filter === "all" ? events : events.filter((entry) => entry.type === filter)
    return (
      <div className="w-full space-y-3">
        {flat.map((entry) => (
          <LogbookUnifiedEntryCard
            key={entry.id}
            entries={[entry]}
            dayEntries={entries}
            onMealUpdated={onMealUpdated}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      {visibleGroups.map((group) => (
        <LogbookUnifiedEntryCard
          key={[...group].map((entry) => entry.id).sort().join("|")}
          entries={group}
          dayEntries={entries}
          onMealUpdated={onMealUpdated}
        />
      ))}
    </div>
  )
}
