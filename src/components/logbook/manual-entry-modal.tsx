"use client"

import { useState } from "react"
import { Entry, EntryType } from "@/lib/types"
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
import { useTranslation } from "@/hooks/useTranslation"
import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ManualEntryModalProps {
  open: boolean
  onClose: () => void
  onSave: (entry: Entry) => void
}

export function ManualEntryModal({
  open,
  onClose,
  onSave,
}: ManualEntryModalProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [entryType, setEntryType] = useState<EntryType>("glucose")
  const [entryData, setEntryData] = useState<Partial<Entry>>({
    type: "glucose",
    timestamp: new Date().toISOString(),
    source: "manual",
    userId: "user-001",
  })

  const handleSave = () => {
    if (!entryData.type) return

    // Create complete entry
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

  const content = (
    <>
      <div className="mb-6">
        <Tabs value={entryType} onValueChange={(v) => {
          setEntryType(v as EntryType)
          setEntryData({
            type: v as EntryType,
            timestamp: new Date().toISOString(),
            source: "manual",
            userId: "user-001",
          })
        }}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="glucose" className="flex flex-col gap-1 h-auto py-2">
              <Droplet className="h-4 w-4" />
              <span className="text-xs">{t("common.glucose")}</span>
            </TabsTrigger>
            <TabsTrigger value="insulin" className="flex flex-col gap-1 h-auto py-2">
              <Syringe className="h-4 w-4" />
              <span className="text-xs">{t("common.insulin")}</span>
            </TabsTrigger>
            <TabsTrigger value="meal" className="flex flex-col gap-1 h-auto py-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-xs">{t("common.meal")}</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col gap-1 h-auto py-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">{t("common.activity")}</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex flex-col gap-1 h-auto py-2">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{t("common.mood")}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {renderForm()}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} className="flex-1">
          {t("common.save")}
        </Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{t("logbook.newEntry")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("logbook.newEntry")}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
