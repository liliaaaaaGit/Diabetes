"use client"

import { useState, useMemo, useCallback } from "react"
import { Entry, EntryType } from "@/lib/types"
import { AppShell } from "@/components/shared/app-shell"
import { FilterTabs } from "@/components/logbook/filter-tabs"
import { LogbookWeekCalendar } from "@/components/logbook/logbook-week-calendar"
import { LogbookDayView } from "@/components/logbook/logbook-day-view"
import { ManualEntryModal } from "@/components/logbook/manual-entry-modal"
import { AiQuickInput } from "@/components/logbook/ai-quick-input"
import { useTranslation } from "@/hooks/useTranslation"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useEntries } from "@/hooks/useEntries"
import { useUser } from "@/hooks/useUser"
import { createEntry } from "@/lib/db"
import { addDays, isSameDay, parseISO, startOfDay } from "date-fns"

export default function LogbookPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const [activeFilter, setActiveFilter] = useState<EntryType | "all">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const { entries, loading, error, refetch } = useEntries(undefined, userId)

  const dayEntries = useMemo(() => {
    return entries.filter((e) => isSameDay(parseISO(e.timestamp), selectedDate))
  }, [entries, selectedDate])

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: dayEntries.length,
    }
    ;(["glucose", "insulin", "meal", "activity", "mood"] as EntryType[]).forEach((type) => {
      c[type] = dayEntries.filter((e) => e.type === type).length
    })
    return c
  }, [dayEntries])

  const handleShiftWeek = useCallback(
    (direction: -1 | 1) => {
      setSelectedDate((d) => addDays(d, direction * 7))
    },
    []
  )

  const handleSave = (newEntry: Entry) => {
    void (async () => {
      if (!userId) return
      try {
        await createEntry(userId, newEntry)
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
      mainClassName="max-w-none w-full px-4 md:px-6 py-4 md:py-6"
      actions={
        <Button onClick={() => setIsModalOpen(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t("logbook.manualFallback")}
        </Button>
      }
    >
      <div className="space-y-4 w-full">
        <AiQuickInput
          onManualFallback={() => setIsModalOpen(true)}
          onRefetch={refetch}
        />

        <div className="sticky top-16 z-20 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-4 space-y-4 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/90">
          <LogbookWeekCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onShiftWeek={handleShiftWeek}
            onGoToday={() => setSelectedDate(startOfDay(new Date()))}
            entries={entries}
          />
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
          />
        )}
      </div>

      <ManualEntryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </AppShell>
  )
}
