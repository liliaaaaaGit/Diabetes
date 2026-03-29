"use client"

import { useMemo } from "react"
import type { Entry, EntryType, GlucoseEntry, InsulinEntry, MealEntry } from "@/lib/types"
import { clusterEntriesByTime } from "@/lib/logbook-cluster"
import { EntryCard } from "./entry-card"
import { ConsolidatedEntryCard } from "./consolidated-entry-card"
import { EmptyState } from "@/components/shared/empty-state"
import { BookOpen } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { format } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"

function mgDl(g: GlucoseEntry): number {
  return g.unit === "mmol_l" ? g.value * 18.0182 : g.value
}

interface LogbookDayViewProps {
  selectedDate: Date
  filter: EntryType | "all"
  entriesForDay: Entry[]
}

export function LogbookDayView({ selectedDate, filter, entriesForDay }: LogbookDayViewProps) {
  const { t, locale } = useTranslation()
  const dateLocale = locale === "de" ? de : enUS

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entriesForDay
    return entriesForDay.filter((e) => e.type === filter)
  }, [entriesForDay, filter])

  const clusters = useMemo(
    () => clusterEntriesByTime(filteredEntries),
    [filteredEntries]
  )

  const displayClusters = useMemo(() => [...clusters].reverse(), [clusters])

  const summary = useMemo(() => {
    const g = filteredEntries.filter((e) => e.type === "glucose") as GlucoseEntry[]
    const ins = filteredEntries.filter((e) => e.type === "insulin") as InsulinEntry[]
    const meals = filteredEntries.filter((e) => e.type === "meal") as MealEntry[]

    const avgGlucose =
      g.length > 0
        ? Math.round((g.reduce((s, x) => s + mgDl(x), 0) / g.length) * 10) / 10
        : null

    const sumCarbs = meals.reduce((s, m) => s + (m.carbsGrams ?? 0), 0)
    const sumInsulin = ins.reduce((s, i) => s + i.dose, 0)

    return {
      count: filteredEntries.length,
      avgGlucose,
      sumCarbs,
      sumInsulin,
      showAvg:
        (filter === "all" || filter === "glucose") && g.length > 0 && avgGlucose != null,
      showCarbs: (filter === "all" || filter === "meal") && meals.length > 0,
      showInsulin: (filter === "all" || filter === "insulin") && ins.length > 0,
    }
  }, [filteredEntries, filter])

  const dateTitle = format(selectedDate, "EEEE, d. MMMM yyyy", { locale: dateLocale })

  if (filteredEntries.length === 0) {
    const allEmpty = filter === "all" && entriesForDay.length === 0
    return (
      <EmptyState
        icon={BookOpen}
        title={allEmpty ? t("logbook.noEntriesDay") : t("logbook.noEntriesFilter")}
        description={allEmpty ? t("empty.noEntriesYetDesc") : t("empty.noEntriesDesc")}
      />
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">{dateTitle}</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {summary.count}{" "}
              {summary.count === 1 ? t("logbook.entrySingular") : t("logbook.entryPlural")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            {summary.showAvg ? (
              <span>
                {t("logbook.summaryAvgGlucose")}: {summary.avgGlucose} {t("units.mgdl")}
              </span>
            ) : null}
            {summary.showCarbs ? (
              <span>
                {t("logbook.summaryCarbs")}: {summary.sumCarbs}g
              </span>
            ) : null}
            {summary.showInsulin ? (
              <span>
                {t("logbook.summaryInsulin")}: {summary.sumInsulin} {t("units.units")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
        {displayClusters.map((cluster) => {
          if (cluster.length === 1) {
            return <EntryCard key={cluster[0].id} entry={cluster[0]} />
          }
          const key = cluster.map((e) => e.id).join("-")
          return <ConsolidatedEntryCard key={key} entries={cluster} />
        })}
      </div>
    </div>
  )
}
