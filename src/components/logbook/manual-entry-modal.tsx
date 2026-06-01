"use client"

import { useState } from "react"
import { Entry, EntryType, NewEntry } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GlucoseForm } from "./forms/glucose-form"
import { InsulinForm } from "./forms/insulin-form"
import { MealForm } from "./forms/meal-form"
import { ActivityForm } from "./forms/activity-form"
import { MoodForm } from "./forms/mood-form"
import { QuickEntryForm } from "./quick-entry-form"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
} from "lucide-react"

interface ManualEntryModalProps {
  open: boolean
  onClose: () => void
  onSave: (entry: Entry) => void
  /**
   * Fast path: saves several entries at once with no AI. When provided, a
   * "Schnell" tab is shown (and selected by default).
   */
  onQuickSave?: (entries: NewEntry[]) => Promise<void>
  /** Pre-fills the bolus name in the quick form (user's most recent bolus). */
  defaultBolusName?: string
}

type EntryMode = "quick" | "detailed"

const typeTabClass =
  "flex min-h-[44px] min-w-[4.25rem] shrink-0 flex-col gap-1 py-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white"

export function ManualEntryModal({
  open,
  onClose,
  onSave,
  onQuickSave,
  defaultBolusName,
}: ManualEntryModalProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<EntryMode>(onQuickSave ? "quick" : "detailed")
  const [entryType, setEntryType] = useState<EntryType>("glucose")
  const [entryData, setEntryData] = useState<Partial<Entry>>({
    type: "glucose",
    timestamp: new Date().toISOString(),
    source: "manual",
    userId: "user-001",
  })

  const handleSave = () => {
    if (!entryData.type) return

    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      userId: "user-001",
      type: entryData.type,
      timestamp: entryData.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: "manual",
      ...entryData,
    } as Entry

    onSave(newEntry)
    setEntryData({
      type: "glucose",
      timestamp: new Date().toISOString(),
      source: "manual",
      userId: "user-001",
    })
    setEntryType("glucose")
    onClose()
  }

  const renderForm = () => {
    switch (entryType) {
      case "glucose":
        return (
          <GlucoseForm
            value={entryData as any}
            onChange={(data) => setEntryData({ ...entryData, ...data })}
          />
        )
      case "insulin":
        return (
          <InsulinForm
            value={entryData as any}
            onChange={(data) => setEntryData({ ...entryData, ...data })}
          />
        )
      case "meal":
        return (
          <MealForm
            value={entryData as any}
            onChange={(data) => setEntryData({ ...entryData, ...data })}
          />
        )
      case "activity":
        return (
          <ActivityForm
            value={entryData as any}
            onChange={(data) => setEntryData({ ...entryData, ...data })}
          />
        )
      case "mood":
        return (
          <MoodForm
            value={entryData as any}
            onChange={(data) => setEntryData({ ...entryData, ...data })}
          />
        )
    }
  }

  const handleQuickSave = async (entries: NewEntry[]) => {
    if (!onQuickSave) return
    await onQuickSave(entries)
    onClose()
  }

  const detailedContent = (
    <>
      <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
        <Tabs
          value={entryType}
          onValueChange={(v) => {
            setEntryType(v as EntryType)
            setEntryData({
              type: v as EntryType,
              timestamp: new Date().toISOString(),
              source: "manual",
              userId: "user-001",
            })
          }}
        >
          <TabsList className="inline-flex h-auto w-max min-w-full gap-1 bg-slate-100 p-1">
            <TabsTrigger value="glucose" className={typeTabClass}>
              <Droplet className="h-4 w-4" />
              <span className="text-xs">{t("common.glucose")}</span>
            </TabsTrigger>
            <TabsTrigger value="insulin" className={typeTabClass}>
              <Syringe className="h-4 w-4" />
              <span className="text-xs">{t("common.insulin")}</span>
            </TabsTrigger>
            <TabsTrigger value="meal" className={typeTabClass}>
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-xs">{t("common.meal")}</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className={typeTabClass}>
              <Activity className="h-4 w-4" />
              <span className="text-xs">{t("common.activity")}</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className={typeTabClass}>
              <Heart className="h-4 w-4" />
              <span className="text-xs">{t("common.mood")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain scroll-pb-24 [-webkit-overflow-scrolling:touch]">
        {renderForm()}
      </div>

      <div className="mt-4 flex gap-3 border-t pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" onClick={onClose} className="min-h-[44px] flex-1">
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} className="min-h-[44px] flex-1">
          {t("common.save")}
        </Button>
      </div>
    </>
  )

  const content = (
    <>
      {onQuickSave && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`min-h-[40px] rounded-md text-sm font-medium ${
              mode === "quick" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            {t("logbook.quickTab")}
          </button>
          <button
            type="button"
            onClick={() => setMode("detailed")}
            className={`min-h-[40px] rounded-md text-sm font-medium ${
              mode === "detailed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            {t("logbook.detailedTab")}
          </button>
        </div>
      )}

      {mode === "quick" && onQuickSave ? (
        <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <QuickEntryForm
            defaultBolusName={defaultBolusName}
            onSubmit={handleQuickSave}
            onCancel={onClose}
          />
        </div>
      ) : (
        detailedContent
      )}
    </>
  )

  return (
    <>
      {/* Mobile: bottom sheet (CSS breakpoint — no hydration flash) */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={(v) => !v && onClose()} modal>
          <SheetContent
            side="bottom"
            className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-2xl px-4 pb-0 pt-6"
          >
            <SheetHeader className="shrink-0 text-left">
              <SheetTitle>{t("logbook.newEntry")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 min-h-0 flex-1 overflow-hidden">{content}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: dialog */}
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("logbook.newEntry")}</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
