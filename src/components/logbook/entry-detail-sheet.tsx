"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import type {
  ActivityEntry,
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MoodEntry,
} from "@/lib/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { useUser } from "@/hooks/useUser"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { useToast } from "@/hooks/use-toast"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"
import { formatInsulin } from "@/lib/insulin-format"
import { getMoodLabel } from "@/lib/mood"
import { deleteEntry, updateEntryNote } from "@/lib/db-client"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"

interface EntryDetailSheetProps {
  entry: Entry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful note save or delete so the parent can refetch. */
  onChanged?: () => void
}

/**
 * Tappable entry detail for non-meal entries (P2.3).
 * Lets the user add/edit a free-text note or delete the entry (with a
 * confirmation step). Notes feed later AI reflection.
 */
export function EntryDetailSheet({ entry, open, onOpenChange, onChanged }: EntryDetailSheetProps) {
  const { t, locale } = useTranslation()
  const { userId } = useUser()
  const { formatGlucoseWithUnit, unitSuffix } = useUserPreferences()
  const { toast } = useToast()
  const loc = locale === "en" ? "en" : "de"
  const dateLocale = loc === "de" ? de : enUS

  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    setNote(entry?.note ?? "")
    setConfirmingDelete(false)
  }, [entry])

  if (!entry) return null

  const timeLabel = format(parseISO(entry.timestamp), "PPp", { locale: dateLocale })

  const summary = (() => {
    if (entry.type === "glucose") {
      const g = entry as GlucoseEntry
      const f = formatGlucoseWithUnit(glucoseEntryToMgDl(g))
      return `${t("logbook.glucose")}: ${f.value} ${f.suffix}`
    }
    if (entry.type === "insulin") {
      const i = entry as InsulinEntry
      return `${t("logbook.insulin")}: ${formatInsulin(i.dose, loc)} ${t("logbook.insulinUnitsAbbrev")}${
        i.insulinName ? ` · ${i.insulinName}` : ""
      }`
    }
    if (entry.type === "activity") {
      const a = entry as ActivityEntry
      return `${a.activityType} · ${a.durationMinutes} ${t("units.minutes")}`
    }
    if (entry.type === "mood") {
      const m = entry as MoodEntry
      return `${t("common.mood")}: ${getMoodLabel(m.moodValue, t)}`
    }
    return ""
  })()

  const handleSaveNote = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await updateEntryNote(userId, entry.id, note)
      toast({ title: t("logbook.noteSaved") })
      onChanged?.()
      onOpenChange(false)
    } catch (e) {
      toast({
        title: t("logbook.noteSaveFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await deleteEntry(userId, entry.id)
      toast({ title: t("logbook.entryDeleted") })
      onChanged?.()
      onOpenChange(false)
    } catch (e) {
      toast({
        title: t("logbook.entryDeleteFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{summary}</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-slate-500">{timeLabel}</p>

          <div>
            <Label htmlFor="entry-note" className="text-sm text-slate-600 mb-1.5 block">
              {t("common.note")}
            </Label>
            <Textarea
              id="entry-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("logbook.notePlaceholder")}
              rows={3}
            />
          </div>

          <Button
            type="button"
            className="w-full min-h-[44px]"
            disabled={saving}
            onClick={() => void handleSaveNote()}
          >
            {saving ? t("common.loading") : t("logbook.saveNote")}
          </Button>

          {!confirmingDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-[44px] text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={saving}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("logbook.deleteEntry")}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{t("logbook.deleteConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  disabled={saving}
                  onClick={() => setConfirmingDelete(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700"
                  disabled={saving}
                  onClick={() => void handleDelete()}
                >
                  {t("logbook.deleteEntry")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
