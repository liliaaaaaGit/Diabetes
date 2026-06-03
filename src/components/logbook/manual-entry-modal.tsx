"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Entry, EntryType, NewEntry } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GlucoseForm } from "./forms/glucose-form"
import { InsulinForm } from "./forms/insulin-form"
import { MealForm } from "./forms/meal-form"
import { ActivityForm } from "./forms/activity-form"
import { MoodForm } from "./forms/mood-form"
import { QuickEntryForm } from "./quick-entry-form"
import { useTranslation } from "@/hooks/useTranslation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { shouldPreventRadixOverlayDismiss } from "@/lib/radix-overlay-guards"
import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
  X,
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

const desktopOverlayGuardProps = {
  onPointerDownOutside: (e: Event) => {
    if (shouldPreventRadixOverlayDismiss(e)) e.preventDefault()
  },
  onInteractOutside: (e: Event) => {
    if (shouldPreventRadixOverlayDismiss(e)) e.preventDefault()
  },
}

/**
 * Manual logbook entry (quick + detailed).
 * Mobile: bottom sheet via portal (no Radix Sheet — avoids invisible overlay blocking clicks).
 * Desktop: centered Dialog only.
 */
export function ManualEntryModal({
  open,
  onClose,
  onSave,
  onQuickSave,
  defaultBolusName,
}: ManualEntryModalProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<EntryMode>(onQuickSave ? "quick" : "detailed")
  const [entryType, setEntryType] = useState<EntryType>("glucose")
  const [entryData, setEntryData] = useState<Partial<Entry>>({
    type: "glucose",
    timestamp: new Date().toISOString(),
    source: "manual",
    userId: "user-001",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

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

  const modeTabs = onQuickSave ? (
    <div className="mb-4 grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
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
  ) : null

  const detailedFooter = (
    <div className="flex gap-3">
      <Button variant="outline" onClick={onClose} className="min-h-[44px] flex-1">
        {t("common.cancel")}
      </Button>
      <Button onClick={handleSave} className="min-h-[44px] flex-1">
        {t("common.save")}
      </Button>
    </div>
  )

  const detailedBody = (
    <>
      <div className="-mx-1 shrink-0 overflow-x-auto px-1 pb-1">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 [-webkit-overflow-scrolling:touch]">
        {renderForm()}
      </div>
    </>
  )

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      {modeTabs}

      {mode === "quick" && onQuickSave ? (
        <QuickEntryForm
          defaultBolusName={defaultBolusName}
          onSubmit={handleQuickSave}
          onCancel={onClose}
        />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col">{detailedBody}</div>
          <div className="mt-4 shrink-0 border-t border-slate-200 bg-background pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {detailedFooter}
          </div>
        </>
      )}
    </div>
  )

  if (!open || !mounted) return null

  const modalTitle = t("logbook.newEntry")

  if (isMobile) {
    return createPortal(
      <div
        className="manual-entry-modal-root fixed inset-0 z-[110] flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-entry-modal-title"
      >
        <button
          type="button"
          className="min-h-0 flex-1 w-full bg-black/60 touch-manipulation"
          aria-label={t("common.close")}
          onClick={onClose}
        />
        <div className="relative flex max-h-[min(92dvh,100%)] w-full shrink-0 flex-col overflow-hidden rounded-t-2xl bg-background px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6 shadow-xl touch-manipulation">
          <div className="flex shrink-0 items-center justify-between pb-4">
            <h2 id="manual-entry-modal-title" className="text-lg font-semibold text-slate-900">
              {modalTitle}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      modal
    >
      <DialogContent
        className="manual-entry-modal-root flex max-h-[min(90dvh,900px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
        {...desktopOverlayGuardProps}
      >
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">{content}</div>
      </DialogContent>
    </Dialog>
  )
}
