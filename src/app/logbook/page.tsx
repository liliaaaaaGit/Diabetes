"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { flushSync } from "react-dom"
import { Entry, EntryType, InsulinEntry, NewEntry } from "@/lib/types"
import { AppShell } from "@/components/shared/app-shell"
import { FilterTabs } from "@/components/logbook/filter-tabs"
import { LogbookWeekCalendar } from "@/components/logbook/logbook-week-calendar"
import { LogbookDayView } from "@/components/logbook/logbook-day-view"
import { ManualEntryModal } from "@/components/logbook/manual-entry-modal"
import { AiQuickInput } from "@/components/logbook/ai-quick-input"
import { MealTemplatesSection } from "@/components/logbook/meal-templates-section"
import { useTranslation } from "@/hooks/useTranslation"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { invalidateEntriesCacheForUser, useEntries } from "@/hooks/useEntries"
import { useUser } from "@/hooks/useUser"
import { createEntry } from "@/lib/db-client"
import { useGlucoseSafetyBanner } from "@/contexts/glucose-safety-context"
import { triggerGlucoseSafetyAfterSave } from "@/components/logbook/forms/glucose-form"
import { scoreMoodTextClient } from "@/lib/mood-client"
import { getMoodLabel } from "@/lib/mood"
import { isLogbookEvent } from "@/lib/cgm"
import { addDays, isSameDay, parseISO, startOfDay, startOfWeek } from "date-fns"

export default function LogbookPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const { showGlucoseSafetyIfNeeded } = useGlucoseSafetyBanner()
  const [activeFilter, setActiveFilter] = useState<EntryType | "all">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [didAutoSelectDate, setDidAutoSelectDate] = useState(false)
  const weekStartIso = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return weekStart.toISOString()
  }, [selectedDate])
  const weekEndIso = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return addDays(weekStart, 7).toISOString()
  }, [selectedDate])

  // Main payload: only entries for the currently visible week.
  const { entries, loading, error, refetch } = useEntries(
    { from: weekStartIso, to: weekEndIso },
    userId
  )
  // Tiny helper query to detect the newest entry date without downloading all data.
  const { entries: latestEntries, loading: latestLoading } = useEntries({ limit: 1 }, userId)

  useEffect(() => {
    if (didAutoSelectDate || latestLoading || latestEntries.length === 0) return

    const latestEntry = latestEntries[0]

    if (latestEntry) {
      const latestDay = startOfDay(parseISO(latestEntry.timestamp))
      const today = startOfDay(new Date())
      // Never open on a future day (mock data can extend past today).
      setSelectedDate(latestDay.getTime() > today.getTime() ? today : latestDay)
    }
    setDidAutoSelectDate(true)
  }, [didAutoSelectDate, latestEntries, latestLoading])

  // After an AI/photo save, jump to the day the entry landed on so it's visible.
  const handleNavigateToDate = useCallback((ymd: string) => {
    const d = parseISO(ymd)
    if (Number.isNaN(d.getTime())) return
    setDidAutoSelectDate(true)
    setSelectedDate(startOfDay(d))
  }, [])

  /** After AI/photo save: switch day first, then bust cache and refetch (avoids stale week list). */
  const handleEntrySaved = useCallback(
    async (dates?: string[]) => {
      if (dates?.[0]) {
        flushSync(() => handleNavigateToDate(dates[0]))
      }
      if (userId) invalidateEntriesCacheForUser(userId)
      await refetch()
    },
    [handleNavigateToDate, refetch, userId]
  )

  const dayEntries = useMemo(() => {
    return entries.filter((e) => isSameDay(parseISO(e.timestamp), selectedDate))
  }, [entries, selectedDate])

  const counts = useMemo(() => {
    // Counts mirror the list, which shows events only (the dense CGM stream
    // lives in the chart, not the logbook list).
    const events = dayEntries.filter(isLogbookEvent)
    const c: Record<string, number> = {
      all: events.length,
    }
    ;(["glucose", "insulin", "meal", "activity", "mood"] as EntryType[]).forEach((type) => {
      c[type] = events.filter((e) => e.type === type).length
    })
    // The Blutzucker tab shows the full day's glucose curve (CGM + manual),
    // so its badge counts every glucose reading, not just manual events.
    c.glucose = dayEntries.filter((e) => e.type === "glucose").length
    return c
  }, [dayEntries])

  const handleShiftWeek = useCallback(
    (direction: -1 | 1) => {
      setDidAutoSelectDate(true)
      setSelectedDate((d) => addDays(d, direction * 7))
    },
    []
  )

  // Most recent bolus (rapid) insulin name, used to pre-fill the quick form.
  const defaultBolusName = useMemo(() => {
    const boluses = entries
      .filter(
        (e): e is InsulinEntry =>
          e.type === "insulin" &&
          e.insulinType === "rapid" &&
          e.insulinEntryType === "meal_bolus"
      )
      .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())
    return boluses[0]?.insulinName || undefined
  }, [entries])

  // Fast manual path: write each filled field as its own entry, no AI.
  const handleQuickSave = async (newEntries: NewEntry[]) => {
    if (!userId) return
    let saved = 0
    for (const ne of newEntries) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await createEntry(userId, ne)
        if (ne.type === "glucose") {
          triggerGlucoseSafetyAfterSave(ne, showGlucoseSafetyIfNeeded)
        }
        saved += 1
      } catch (e) {
        toast({
          title: t("logbook.entrySaved"),
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        })
      }
    }
    if (saved > 0) {
      await refetch()
      toast({ title: t("logbook.aiSaveSuccess", { count: saved }) })
    }
  }

  const handleSave = (newEntry: Entry) => {
    void (async () => {
      if (!userId) return
      try {
        let entryToSave: Entry = newEntry
        if (newEntry.type === "mood") {
          const note = (newEntry.note || "").trim()
          if (note) {
            const scoredMood = await scoreMoodTextClient(note)
            entryToSave = { ...newEntry, moodValue: scoredMood, note }
          } else {
            entryToSave = { ...newEntry, note: getMoodLabel(newEntry.moodValue, t) }
          }
        }

        await createEntry(userId, entryToSave)
        if (entryToSave.type === "glucose") {
          triggerGlucoseSafetyAfterSave(entryToSave, showGlucoseSafetyIfNeeded)
        }
        await refetch()
        toast({
          title: t("logbook.entrySaved"),
          description: t("logbook.entrySavedSuccess"),
        })
      } catch (e) {
        toast({
          title: t("logbook.entrySaved"),
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        })
      }
    })()
  }

  return (
    <AppShell
      title={t("pages.logbook")}
      mainClassName="max-w-none w-full px-4 md:px-6 pt-4 md:pt-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-14"
      actions={
        <>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label={t("logbook.manualFallback")}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="hidden md:inline-flex">
            <Plus className="h-4 w-4 mr-2" />
            {t("logbook.manualFallback")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 w-full">
        {/* 1. Calendar first: pick the day before doing anything else. */}
        <LogbookWeekCalendar
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setDidAutoSelectDate(true)
            setSelectedDate(date)
          }}
          onShiftWeek={handleShiftWeek}
          onGoToday={() => {
            setDidAutoSelectDate(true)
            setSelectedDate(startOfDay(new Date()))
          }}
          entries={entries}
        />

        {/* 2. AI entry input: add an entry for the selected day. */}
        <AiQuickInput
          onManualFallback={() => setIsModalOpen(true)}
          onRefetch={refetch}
          onNavigateToDate={handleNavigateToDate}
          onEntrySaved={handleEntrySaved}
        />

        {/* 3. Filter tabs (sticky) sit directly above the entry list. */}
        <div className="sticky top-16 z-20 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-4 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/90">
          <FilterTabs
            activeFilter={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && (
          <p className="text-sm text-slate-500 py-4">{t("common.loading")}</p>
        )}

        {!loading && (
          <LogbookDayView
            selectedDate={selectedDate}
            filter={activeFilter}
            entriesForDay={dayEntries}
            onMealUpdated={() => void refetch()}
          />
        )}
      </div>

      <ManualEntryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onQuickSave={handleQuickSave}
        defaultBolusName={defaultBolusName}
      />
    </AppShell>
  )
}
