"use client"

import { useMemo } from "react"
import type { Entry, EntryType, GlucoseEntry, InsulinEntry, MealEntry } from "@/lib/types"
import { EntryList } from "./entry-list"
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

  const filteredEntries = useMemo(
    () => (filter === "all" ? entriesForDay : entriesForDay.filter((entry) => entry.type === filter)),
    [entriesForDay, filter]
  )

  const summary = useMemo(() => {
    const g = entriesForDay.filter((e) => e.type === "glucose") as GlucoseEntry[]
    const ins = entriesForDay.filter((e) => e.type === "insulin") as InsulinEntry[]
    const meals = entriesForDay.filter((e) => e.type === "meal") as MealEntry[]

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
      showAvg: g.length > 0 && avgGlucose != null,
      showCarbs: meals.length > 0,
      showInsulin: ins.length > 0,
    }
  }, [entriesForDay, filteredEntries.length])

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
    <div className="space-y-3 w-full">
      <div className="border-b-[0.5px] border-slate-200 pb-[10px] mb-[14px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[15px] font-medium text-slate-900">{dateTitle}</p>
          <div className="flex flex-wrap items-center gap-[14px] text-xs text-gray-500">
            {summary.showAvg ? <span>Ø {summary.avgGlucose} mg/dL</span> : null}
            {summary.showCarbs ? <span>{summary.sumCarbs}g KH</span> : null}
            {summary.showInsulin ? <span>{summary.sumInsulin} IE</span> : null}
          </div>
        </div>
      </div>

      <EntryList entries={entriesForDay} filter={filter} />
    </div>
  )
}
