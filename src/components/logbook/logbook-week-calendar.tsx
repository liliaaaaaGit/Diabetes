"use client"

import { useRef } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parse,
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
  const dateInputRef = useRef<HTMLInputElement>(null)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const selectedStart = startOfDay(selectedDate)
  const todayStart = startOfDay(new Date())
  const isTodaySelected = isSameDay(selectedStart, todayStart)

  const openDatePicker = () => {
    const el = dateInputRef.current
    if (!el) return
    if (typeof el.showPicker === "function") {
      el.showPicker()
    } else {
      el.click()
    }
  }

  const onDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!v) return
    const parsed = parse(v, "yyyy-MM-dd", new Date())
    if (!Number.isNaN(parsed.getTime())) {
      onSelectDate(startOfDay(parsed))
    }
  }

  const pickerValue = format(selectedStart, "yyyy-MM-dd")
  const todayPickerMax = format(todayStart, "yyyy-MM-dd")

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm px-2 py-2 md:px-3">
      <input
        ref={dateInputRef}
        type="date"
        value={pickerValue}
        max={todayPickerMax}
        onChange={onDateInputChange}
        className="sr-only"
        aria-label={t("logbook.pickDate")}
      />

      <div className="flex items-center gap-1.5 mb-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onShiftWeek(-1)}
          aria-label={t("logbook.weekPrev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={openDatePicker}
          aria-label={t("logbook.pickDate")}
        >
          <Calendar className="h-4 w-4 text-teal-700" />
        </Button>

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0 px-1">
          {isTodaySelected ? (
            <span className="text-sm font-semibold text-slate-800">{t("logbook.today")}</span>
          ) : (
            <>
              <span className="text-sm font-semibold text-slate-800 truncate text-center">
                {format(selectedDate, "d. MMMM yyyy", { locale: dateLocale })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-xs font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                onClick={onGoToday}
              >
                {t("logbook.today")}
              </Button>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onShiftWeek(1)}
          aria-label={t("logbook.weekNext")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
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
                "flex flex-col items-center justify-center rounded-md py-0.5 px-0.5 transition-colors min-h-[44px] max-h-[50px]",
                selected
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800",
                !selected && todayCell && "ring-1 ring-teal-400 ring-inset"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium leading-tight",
                  selected ? "text-white/90" : "text-slate-500"
                )}
              >
                {format(day, "EEE", { locale: dateLocale })}
              </span>
              <span
                className={cn(
                  "text-base font-semibold tabular-nums leading-none mt-0.5",
                  selected && "text-white"
                )}
              >
                {format(day, "d")}
              </span>
              <span
                className={cn(
                  "mt-0.5 h-1 w-1 rounded-full shrink-0",
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
