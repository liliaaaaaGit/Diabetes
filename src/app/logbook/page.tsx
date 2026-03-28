"use client"

import { useState, useMemo } from "react"
import { Entry, EntryType } from "@/lib/types"
import { AppShell } from "@/components/shared/app-shell"
import { FilterTabs } from "@/components/logbook/filter-tabs"
import { EntryList } from "@/components/logbook/entry-list"
import { ManualEntryModal } from "@/components/logbook/manual-entry-modal"
import { AiQuickInput } from "@/components/logbook/ai-quick-input"
import { useTranslation } from "@/hooks/useTranslation"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useEntries } from "@/hooks/useEntries"
import { useUser } from "@/hooks/useUser"
import { createEntry } from "@/lib/db"

export default function LogbookPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const [activeFilter, setActiveFilter] = useState<EntryType | "all">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { entries, loading, error, refetch } = useEntries(undefined, userId)

  // Calculate counts for each filter
  const counts = useMemo(() => {
    const counts: Record<string, number> = {
      all: entries.length,
    }
    ;(["glucose", "insulin", "meal", "activity", "mood"] as EntryType[]).forEach(
      (type) => {
        counts[type] = entries.filter((e) => e.type === type).length
      }
    )
    return counts
  }, [entries])

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
      actions={
        <Button onClick={() => setIsModalOpen(true)} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t("logbook.manualFallback")}
        </Button>
      }
    >
      <div className="space-y-6">
        <AiQuickInput
          onManualFallback={() => setIsModalOpen(true)}
          onRefetch={refetch}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Filter + list */}
        <FilterTabs
          activeFilter={activeFilter}
          counts={counts}
          onChange={setActiveFilter}
        />

        {loading && (
          <p className="text-sm text-slate-500 py-4">{t("common.loading")}</p>
        )}
        {!loading && <EntryList entries={entries} filter={activeFilter} />}
      </div>

      <ManualEntryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </AppShell>
  )
}
