"use client"

import { Entry, EntryType } from "@/lib/types"
import { EntryCard } from "./entry-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useTranslation } from "@/hooks/useTranslation"
import { format, parseISO, isToday, isYesterday, startOfDay } from "date-fns"
import { de } from "date-fns/locale/de"
import { BookOpen } from "lucide-react"

interface EntryListProps {
  entries: Entry[]
  filter: EntryType | "all"
}

export function EntryList({ entries, filter }: EntryListProps) {
  const { t } = useTranslation()

  // Filter entries
  const filteredEntries =
    filter === "all"
      ? entries
      : entries.filter((entry) => entry.type === filter)

  // Group by date
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = startOfDay(parseISO(entry.timestamp))
    const dateKey = date.toISOString()

    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(entry)
    return acc
  }, {} as Record<string, Entry[]>)

  // Sort dates (newest first)
  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const getDateLabel = (dateKey: string): string => {
    const date = parseISO(dateKey)
    if (isToday(date)) {
      return t("logbook.today")
    } else if (isYesterday(date)) {
      return t("logbook.yesterday")
    } else {
      return format(date, "EEEE, d. MMMM yyyy", { locale: de })
    }
  }

  if (sortedDates.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("empty.noEntries")}
        description={t("empty.noEntriesDesc")}
      />
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dateEntries = groupedEntries[dateKey]
        return (
          <div key={dateKey} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-700">
                {getDateLabel(dateKey)}
              </h3>
              <span className="text-xs text-slate-500">
                {dateEntries.length}{" "}
                {dateEntries.length === 1
                  ? t("logbook.entrySingular")
                  : t("logbook.entryPlural")}
              </span>
            </div>
            <div className="space-y-2">
              {dateEntries
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
                .map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
