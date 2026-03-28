"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  ExtractedEntry,
  EntryType,
  NewEntry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  ActivityEntry,
  MoodEntry,
  MoodValue,
} from "@/lib/types"
import { Sparkles, Check, Loader2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const ENTRY_TYPES: EntryType[] = ["glucose", "insulin", "meal", "activity", "mood"]

const MOOD_EMOJIS: { value: MoodValue; emoji: string; labelKey: string }[] = [
  { value: 1, emoji: "😫", labelKey: "logbook.moodVeryBad" },
  { value: 2, emoji: "😕", labelKey: "logbook.moodBad" },
  { value: 3, emoji: "😐", labelKey: "logbook.moodNeutral" },
  { value: 4, emoji: "🙂", labelKey: "logbook.moodGood" },
  { value: 5, emoji: "😄", labelKey: "logbook.moodGreat" },
]

type ExtractionConfirmationProps = {
  extractedEntries: ExtractedEntry[]
  aiMessage: string
  title?: string
  onSaveEntry: (entry: NewEntry) => Promise<void>
  /** Called after attempting all saves; parent can clear UI when failed === 0 and saved > 0. */
  onSaveResult?: (result: { saved: number; failed: number }) => void
  onDiscard: () => void
  source?: "manual" | "conversation"
  conversationId?: string
}

function getEntryTypeFromData(data: ExtractedEntry["data"]): EntryType | null {
  const d = data as Record<string, unknown>
  if (typeof d.moodValue === "number") return "mood"
  if (typeof d.dose === "number") return "insulin"
  if (typeof d.value === "number") return "glucose"
  if (typeof d.mealType === "string" || (typeof d.description === "string" && d.description !== ""))
    return "meal"
  if (typeof d.activityType === "string") return "activity"
  return null
}

function resolveEntryType(entry: ExtractedEntry): EntryType | null {
  if (entry.type && ENTRY_TYPES.includes(entry.type)) return entry.type
  return getEntryTypeFromData(entry.data)
}

function getTypeLabel(t: (key: string) => string, type: EntryType) {
  switch (type) {
    case "glucose":
      return t("common.glucose")
    case "insulin":
      return t("common.insulin")
    case "meal":
      return t("common.meal")
    case "activity":
      return t("common.activity")
    case "mood":
      return t("common.mood")
    default:
      return t("logbook.entry")
  }
}

function isMealCarbsEstimated(data: Record<string, unknown>): boolean {
  if (data.estimated === false) return false
  return true
}

type Row = ExtractedEntry & { resolvedType: EntryType | null }

export function ExtractionConfirmation({
  extractedEntries,
  aiMessage,
  title,
  onSaveEntry,
  onSaveResult,
  onDiscard,
  source = "conversation",
  conversationId,
}: ExtractionConfirmationProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [entries, setEntries] = useState<ExtractedEntry[]>(extractedEntries)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEntries(extractedEntries)
  }, [extractedEntries])

  const computed: Row[] = useMemo(() => {
    return entries.map((e) => ({
      ...e,
      resolvedType: resolveEntryType(e),
    }))
  }, [entries])

  const handleToggleIncluded = (idx: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, included: !e.included } : e))
    )
  }

  const updateEntryData = (idx: number, patch: Record<string, unknown>) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, data: { ...e.data, ...patch } } : e))
    )
  }

  const buildNewEntryFromExtracted = (entry: ExtractedEntry): NewEntry | null => {
    const data = entry.data as Record<string, unknown>
    const type = resolveEntryType(entry)
    if (!type) return null

    const timestamp = new Date().toISOString()
    const note = entry.sourceText

    if (type === "glucose") {
      const value = Number(data.value)
      if (!Number.isFinite(value)) return null
      return {
        type,
        source,
        timestamp,
        note,
        conversationId,
        value,
        unit: (data.unit as GlucoseEntry["unit"]) ?? "mg_dl",
        context: (data.context as GlucoseEntry["context"]) ?? "other",
      } as NewEntry
    }

    if (type === "insulin") {
      const dose = Number(data.dose)
      if (!Number.isFinite(dose)) return null
      return {
        type,
        source,
        timestamp,
        note,
        conversationId,
        dose,
        insulinType: (data.insulinType as InsulinEntry["insulinType"]) ?? "rapid",
        insulinName: (data.insulinName as string | undefined) ?? undefined,
      } as NewEntry
    }

    if (type === "meal") {
      const description = String(data.description ?? "")
      if (!description.trim()) return null
      return {
        type,
        source,
        timestamp,
        note,
        conversationId,
        description,
        carbsGrams: data.carbsGrams !== undefined ? Number(data.carbsGrams) : undefined,
        mealType: (data.mealType as MealEntry["mealType"]) ?? "lunch",
      } as NewEntry
    }

    if (type === "activity") {
      const activityType = String(data.activityType ?? "")
      if (!activityType.trim()) return null
      return {
        type,
        source,
        timestamp,
        note,
        conversationId,
        activityType,
        durationMinutes:
          data.durationMinutes !== null && data.durationMinutes !== undefined
            ? Number(data.durationMinutes)
            : 0,
        intensity: (data.intensity as ActivityEntry["intensity"]) ?? "medium",
      } as NewEntry
    }

    const moodVal = Number(data.moodValue)
    const moodValue = (Number.isFinite(moodVal) ? Math.min(5, Math.max(1, Math.round(moodVal))) : 3) as MoodValue
    return {
      type: "mood",
      source,
      timestamp,
      note,
      conversationId,
      moodValue,
    } as NewEntry
  }

  const handleConfirmSave = async () => {
    const included = entries.filter((e) => e.included)
    const newEntries = included
      .map((e) => buildNewEntryFromExtracted(e))
      .filter(Boolean) as NewEntry[]

    if (newEntries.length === 0) return

    setSaving(true)
    let saved = 0
    let failed = 0

    for (const ne of newEntries) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await onSaveEntry(ne)
        saved += 1
      } catch {
        failed += 1
      }
    }

    setSaving(false)

    if (saved > 0) {
      toast({
        title: t("logbook.aiSaveSuccess", { count: saved }),
      })
    }
    if (failed > 0) {
      toast({
        title:
          saved > 0
            ? t("logbook.aiSavePartialFailed", { count: failed })
            : t("logbook.aiSaveFailed"),
        variant: "destructive",
      })
    }

    onSaveResult?.({ saved, failed })
  }

  const renderMiniForm = (entry: Row, idx: number) => {
    const type = entry.resolvedType
    if (!type) return null

    const warn = entry.confidence < 0.8

    if (type === "glucose") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Input
              type="number"
              inputMode="decimal"
              value={(entry.data as GlucoseEntry).value ?? ""}
              onChange={(e) => updateEntryData(idx, { value: Number(e.target.value) })}
              className={warn ? "border-yellow-300" : undefined}
              placeholder={t("logbook.value")}
            />
          </div>
          <div>
            <Select
              value={(entry.data as GlucoseEntry).unit ?? "mg_dl"}
              onValueChange={(v) => updateEntryData(idx, { unit: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mg_dl">{t("units.mgdl")}</SelectItem>
                <SelectItem value="mmol_l">{t("units.mmoll")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Select
              value={(entry.data as GlucoseEntry).context ?? "other"}
              onValueChange={(v) => updateEntryData(idx, { context: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fasting">{t("dashboard.fasting")}</SelectItem>
                <SelectItem value="pre_meal">{t("dashboard.beforeMeal")}</SelectItem>
                <SelectItem value="post_meal">{t("dashboard.afterMeal")}</SelectItem>
                <SelectItem value="bedtime">{t("dashboard.bedtime")}</SelectItem>
                <SelectItem value="other">{t("dashboard.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (type === "insulin") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Input
              type="number"
              inputMode="decimal"
              value={(entry.data as InsulinEntry).dose ?? ""}
              onChange={(e) => updateEntryData(idx, { dose: Number(e.target.value) })}
              className={warn ? "border-yellow-300" : undefined}
              placeholder={t("logbook.dose")}
            />
          </div>
          <div>
            <Select
              value={(entry.data as InsulinEntry).insulinType ?? "rapid"}
              onValueChange={(v) => updateEntryData(idx, { insulinType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rapid">{t("logbook.rapid")}</SelectItem>
                <SelectItem value="long_acting">{t("logbook.longActing")}</SelectItem>
                <SelectItem value="mixed">{t("logbook.mixed")}</SelectItem>
                <SelectItem value="other">{t("logbook.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Input
              value={(entry.data as InsulinEntry).insulinName ?? ""}
              onChange={(e) => updateEntryData(idx, { insulinName: e.target.value || undefined })}
              placeholder={t("logbook.insulinName")}
            />
            <p className="text-xs text-slate-500 mt-2">{t("logbook.insulinNote")}</p>
          </div>
        </div>
      )
    }

    if (type === "meal") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="col-span-2">
            <Textarea
              value={(entry.data as MealEntry).description ?? ""}
              onChange={(e) => updateEntryData(idx, { description: e.target.value })}
              placeholder={t("logbook.description")}
              className={warn ? "border-yellow-300" : undefined}
              rows={1}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={(entry.data as MealEntry).carbsGrams ?? ""}
                onChange={(e) =>
                  updateEntryData(idx, {
                    carbsGrams: e.target.value ? Number(e.target.value) : undefined,
                    estimated: false,
                  })
                }
                placeholder={t("logbook.estimatedCarbs")}
              />
              {isMealCarbsEstimated(entry.data as Record<string, unknown>) ? (
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                  {t("logbook.estimatedCarbsHint")}
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <Select
              value={(entry.data as MealEntry).mealType ?? "lunch"}
              onValueChange={(v) => updateEntryData(idx, { mealType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">{t("logbook.breakfast")}</SelectItem>
                <SelectItem value="lunch">{t("logbook.lunch")}</SelectItem>
                <SelectItem value="dinner">{t("logbook.dinner")}</SelectItem>
                <SelectItem value="snack">{t("logbook.snack")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (type === "activity") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="col-span-2">
            <Input
              value={(entry.data as ActivityEntry).activityType ?? ""}
              onChange={(e) => updateEntryData(idx, { activityType: e.target.value })}
              placeholder={t("logbook.activity")}
              className={warn ? "border-yellow-300" : undefined}
            />
          </div>
          <div>
            <Input
              type="number"
              inputMode="numeric"
              value={(entry.data as ActivityEntry).durationMinutes ?? ""}
              onChange={(e) =>
                updateEntryData(idx, {
                  durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder={t("logbook.duration")}
            />
          </div>
          <div>
            <Select
              value={(entry.data as ActivityEntry).intensity ?? "low"}
              onValueChange={(v) => updateEntryData(idx, { intensity: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("logbook.low")}</SelectItem>
                <SelectItem value="medium">{t("logbook.medium")}</SelectItem>
                <SelectItem value="high">{t("logbook.high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (type === "mood") {
      const current = Math.min(
        5,
        Math.max(1, Math.round(Number((entry.data as MoodEntry).moodValue) || 3))
      ) as MoodValue
      return (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2">{t("logbook.moodPickHint")}</p>
          <div className="flex flex-wrap gap-2">
            {MOOD_EMOJIS.map(({ value, emoji, labelKey }) => (
              <Button
                key={value}
                type="button"
                variant={current === value ? "default" : "outline"}
                size="sm"
                className="h-11 min-w-[3rem] text-xl rounded-xl"
                onClick={() => updateEntryData(idx, { moodValue: value })}
                title={t(labelKey)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  const renderValueHint = (entry: Row) => {
    const type = entry.resolvedType
    if (!type) return null
    const d = entry.data as Record<string, unknown>

    const mealEstimated =
      type === "meal" && isMealCarbsEstimated(d)
        ? (
            <span className="ml-1 text-xs text-slate-400">{t("logbook.estimatedCarbsHint")}</span>
          )
        : null

    if (type === "glucose" && typeof d.value === "number") {
      const unit = d.unit === "mmol_l" ? t("units.mmoll") : t("units.mgdl")
      return (
        <p className="mt-1 text-sm text-slate-700">
          {d.value} {unit}
        </p>
      )
    }

    if (type === "insulin" && typeof d.dose === "number") {
      return (
        <p className="mt-1 text-sm text-slate-700">
          {d.dose} {t("units.units")}
        </p>
      )
    }

    if (type === "meal" && (typeof d.carbsGrams === "number" || typeof d.description === "string")) {
      return (
        <p className="mt-1 text-sm text-slate-700">
          {typeof d.carbsGrams === "number" ? (
            <>
              {d.carbsGrams}g KH{mealEstimated}
            </>
          ) : (
            <>
              {t("logbook.estimatedCarbs")}
              {mealEstimated}
            </>
          )}
        </p>
      )
    }

    if (type === "activity") {
      const mins =
        d.durationMinutes !== null &&
        d.durationMinutes !== undefined &&
        Number.isFinite(Number(d.durationMinutes))
          ? Number(d.durationMinutes)
          : null
      return mins !== null ? (
        <p className="mt-1 text-sm text-slate-700">
          {mins} {t("units.minutes")}
        </p>
      ) : null
    }

    if (type === "mood" && typeof d.moodValue === "number") {
      return (
        <p className="mt-1 text-sm text-slate-700">
          {t("common.mood")} {d.moodValue}/5
        </p>
      )
    }

    return null
  }

  return (
    <Card className="mt-4 rounded-xl border border-blue-100 bg-blue-50/90">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {title ?? t("logbook.extractionDetectedEntries")}
              </p>
              {aiMessage ? <p className="text-xs text-slate-600 mt-1">{aiMessage}</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {computed.map((entry, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {entry.resolvedType ? getTypeLabel(t, entry.resolvedType) : t("logbook.entry")}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{entry.sourceText}</p>
                  {renderValueHint(entry)}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const d = entry.data as Record<string, unknown>
                      const implausible =
                        (entry.resolvedType === "glucose" &&
                          typeof d.value === "number" &&
                          d.value > 600) ||
                        (entry.resolvedType === "insulin" &&
                          typeof d.dose === "number" &&
                          d.dose > 100) ||
                        (entry.resolvedType === "meal" &&
                          typeof d.carbsGrams === "number" &&
                          d.carbsGrams > 500)

                      return implausible ? (
                        <Badge
                          variant="outline"
                          className="border-yellow-300 text-yellow-700 bg-yellow-50"
                        >
                          {t("logbook.checkValue")}
                        </Badge>
                      ) : null
                    })()}
                    {entry.confidence < 0.8 ? (
                      <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                        {t("logbook.unsure")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {Math.round(entry.confidence * 100)}%
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant={entry.included ? "default" : "outline"}
                      size="icon"
                      onClick={() => handleToggleIncluded(idx)}
                      className="h-9 w-9 rounded-full"
                    >
                      {entry.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {renderMiniForm(entry, idx)}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={() => void handleConfirmSave()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("logbook.savingEntries")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
          <Button variant="ghost" onClick={onDiscard} className="flex-1" disabled={saving}>
            {t("logbook.discard")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
