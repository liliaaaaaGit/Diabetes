"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import type { Entry } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"

interface LogbookWeekCalendarProps {
  selectedDate: Date
  onSelectDate: (day: Date) => void
  onShiftWeek: (direction: -1 | 1) => void
  onGoToday: () => void
  entries: Entry[]
}

function dayHasEntries(entries: Entry[], day: Date): boolean {
  return entries.some((e) => isSameDay(parseISO(e.timestamp), day))
}

export function LogbookWeekCalendar({
  selectedDate,
  onSelectDate,
  onShiftWeek,
  onGoToday,
  entries,
}: LogbookWeekCalendarProps) {
  const { t, locale } = useTranslation()
  const dateLocale = locale === "de" ? de : enUS

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const selectedStart = startOfDay(selectedDate)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-2 py-3 md:px-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onShiftWeek(-1)}
          aria-label={t("logbook.weekPrev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50"
          onClick={onGoToday}
        >
          {t("logbook.today")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onShiftWeek(1)}
          aria-label={t("logbook.weekNext")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const selected = isSameDay(day, selectedStart)
          const todayCell = isToday(day)
          const hasData = dayHasEntries(entries, day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(startOfDay(day))}
              className={cn(
                "flex flex-col items-center rounded-lg py-2 px-0.5 sm:px-1 transition-colors min-h-[72px]",
                selected
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800",
                !selected && todayCell && "ring-2 ring-teal-400 ring-offset-1"
              )}
            >
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium uppercase tracking-wide",
                  selected ? "text-white/90" : "text-slate-500"
                )}
              >
                {format(day, "EEE", { locale: dateLocale })}
              </span>
              <span className={cn("text-base sm:text-lg font-semibold tabular-nums", selected && "text-white")}>
                {format(day, "d")}
              </span>
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 rounded-full",
                  hasData ? (selected ? "bg-white" : "bg-teal-500") : selected ? "bg-white/40" : "bg-slate-300"
                )}
                aria-hidden
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
