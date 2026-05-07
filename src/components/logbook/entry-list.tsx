"use client"

import { useMemo } from "react"
import type { Entry, EntryType } from "@/lib/types"
import { parseISO } from "date-fns"
import { MomentCard } from "./entry-card"

const GROUP_WINDOW_MINUTES = 45

function groupEntriesByMoment(entries: Entry[]): Entry[][] {
  if (entries.length === 0) return []

  const sorted = [...entries].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  )

  const groups: Entry[][] = []
  let currentGroup: Entry[] = [sorted[0]]
  let groupStartTime = parseISO(sorted[0].timestamp).getTime()

  for (let idx = 1; idx < sorted.length; idx += 1) {
    const entry = sorted[idx]
    const entryTime = parseISO(entry.timestamp).getTime()
    const diffMinutes = (entryTime - groupStartTime) / (1000 * 60)

    if (diffMinutes <= GROUP_WINDOW_MINUTES) {
      currentGroup.push(entry)
      continue
    }

    groups.push(currentGroup)
    currentGroup = [entry]
    groupStartTime = entryTime
  }

  groups.push(currentGroup)
  return groups
}

interface EntryListProps {
  entries: Entry[]
  filter: EntryType | "all"
}

export function EntryList({ entries, filter }: EntryListProps) {
  const groupedEntries = useMemo(() => groupEntriesByMoment(entries), [entries])

  const visibleGroups = useMemo(() => {
    if (filter === "all") return groupedEntries

    return groupedEntries
      .map((group) => group.filter((entry) => entry.type === filter))
      .filter((group) => group.length > 0)
  }, [filter, groupedEntries])

  return (
    <div className="w-full">
      {visibleGroups.map((group) => (
        <MomentCard
          key={group.map((entry) => entry.id).join("-")}
          entries={group}
        />
      ))}
    </div>
  )
}
