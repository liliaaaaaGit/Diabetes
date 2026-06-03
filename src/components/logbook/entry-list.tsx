"use client"

import { useMemo } from "react"
import type { Entry, EntryType } from "@/lib/types"
import { parseISO } from "date-fns"
import { LogbookUnifiedEntryCard } from "./logbook-unified-entry-card"
import { isLogbookEvent } from "@/lib/cgm"

const ts = (e: Entry) => parseISO(e.timestamp).getTime()

interface EntryListProps {
  entries: Entry[]
  filter: EntryType | "all"
  onMealUpdated?: () => void
}

/**
 * One card per logbook event (meals, insulin, mood, …). CGM stream stays in the chart only.
 * Flat list avoids grouping edge cases that hid newly saved AI meals.
 */
export function EntryList({ entries, filter, onMealUpdated }: EntryListProps) {
  const visibleEvents = useMemo(() => {
    const events = entries.filter(isLogbookEvent)
    const filtered =
      filter === "all" ? events : events.filter((entry) => entry.type === filter)
    return [...filtered].sort((a, b) => ts(b) - ts(a))
  }, [entries, filter])

  if (visibleEvents.length === 0) {
    return null
  }

  return (
    <div className="w-full space-y-3">
      {visibleEvents.map((entry) => (
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
