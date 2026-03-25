"use client"

import { useMemo, useState } from "react"
import type {
  ExtractedEntry,
  EntryType,
  NewEntry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  ActivityEntry,
  MoodEntry,
} from "@/lib/types"
import { Sparkles, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type ExtractionConfirmationProps = {
  extractedEntries: ExtractedEntry[]
  aiMessage: string
  title?: string
  onSave: (entries: NewEntry[]) => void
  onDiscard: () => void
  source?: "conversation"
  conversationId?: string
}

function getEntryTypeFromData(data: ExtractedEntry["data"]): EntryType | null {
  if (typeof (data as any).value === "number") return "glucose"
  if (typeof (data as any).dose === "number") return "insulin"
  if (typeof (data as any).mealType === "string") return "meal"
  if (typeof (data as any).activityType === "string") return "activity"
  if (typeof (data as any).moodValue === "number") return "mood"
  // fallback: some fields might be named differently
  if (typeof (data as any).context === "string" && typeof (data as any).value === "number") return "glucose"
  return null
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

export function ExtractionConfirmation({
  extractedEntries,
  aiMessage,
  title,
  onSave,
  onDiscard,
  source = "conversation",
  conversationId,
}: ExtractionConfirmationProps) {
  const { t } = useTranslation()

  const [entries, setEntries] = useState<ExtractedEntry[]>(extractedEntries)

  const computed = useMemo(() => {
    return entries.map((e) => {
      const type = getEntryTypeFromData(e.data)
      return { ...e, type }
    })
  }, [entries])

  const handleToggleIncluded = (idx: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, included: !e.included } : e))
    )
  }

  const updateEntryData = (idx: number, patch: any) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, data: { ...e.data, ...patch } } : e))
    )
  }

  const buildNewEntryFromExtracted = (entry: ExtractedEntry): NewEntry | null => {
    const data = entry.data as any
    const type = getEntryTypeFromData(entry.data)
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
        unit: (data.unit as any) ?? "mg_dl",
        context: (data.context as any) ?? "other",
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
        insulinType: (data.insulinType as any) ?? "rapid",
        insulinName: data.insulinName ?? undefined,
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
        mealType: (data.mealType as any) ?? "lunch",
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
        intensity: (data.intensity as any) ?? "medium",
      } as NewEntry
    }

    // mood
    return {
      type: "mood",
      source,
      timestamp,
      note,
      conversationId,
      moodValue: (data.moodValue as any) ?? 3,
    } as NewEntry
  }

  const renderMiniForm = (entry: (typeof computed)[number], idx: number) => {
    const type = entry.type
    if (!type) return null

    const warn = entry.confidence < 0.8

    if (type === "glucose") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Input
              type="number"
              inputMode="decimal"
              value={((entry.data as any).value as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { value: Number(e.target.value) })}
              className={warn ? "border-yellow-300" : undefined}
              placeholder={t("logbook.value")}
            />
          </div>
          <div>
            <Select
              value={((entry.data as any).unit as any) ?? "mg_dl"}
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
              value={((entry.data as any).context as any) ?? "other"}
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
              value={((entry.data as any).dose as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { dose: Number(e.target.value) })}
              className={warn ? "border-yellow-300" : undefined}
              placeholder={t("logbook.dose")}
            />
          </div>
          <div>
            <Select
              value={((entry.data as any).insulinType as any) ?? "rapid"}
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
              value={((entry.data as any).insulinName as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { insulinName: e.target.value || undefined })}
              placeholder={t("logbook.insulinName")}
            />
            <p className="text-xs text-slate-500 mt-2">
              {t("logbook.insulinNote")}
            </p>
          </div>
        </div>
      )
    }

    if (type === "meal") {
      return (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="col-span-2">
            <Textarea
              value={((entry.data as any).description as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { description: e.target.value })}
              placeholder={t("logbook.description")}
              className={warn ? "border-yellow-300" : undefined}
              rows={1}
            />
          </div>
          <div>
            <Input
              type="number"
              inputMode="decimal"
              value={((entry.data as any).carbsGrams as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { carbsGrams: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={t("logbook.estimatedCarbs")}
            />
          </div>
          <div>
            <Select
              value={((entry.data as any).mealType as any) ?? "lunch"}
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
              value={((entry.data as any).activityType as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { activityType: e.target.value })}
              placeholder={t("logbook.activity")}
              className={warn ? "border-yellow-300" : undefined}
            />
          </div>
          <div>
            <Input
              type="number"
              inputMode="numeric"
              value={((entry.data as any).durationMinutes as any) ?? ""}
              onChange={(e) => updateEntryData(idx, { durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={t("logbook.duration")}
            />
          </div>
          <div>
            <Select
              value={((entry.data as any).intensity as any) ?? "low"}
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

    return null
  }

  const renderValueHint = (entry: (typeof computed)[number]) => {
    const type = entry.type
    if (!type) return null
    const d = entry.data as any

    const estimated = Boolean(d?.estimated)
    const estimatedLabel = estimated ? (
      <span className="ml-1 text-xs text-slate-400">(geschaetzt)</span>
    ) : null

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
              {d.carbsGrams}g KH{estimatedLabel}
            </>
          ) : (
            <>
              {t("logbook.estimatedCarbs")}{estimatedLabel}
            </>
          )}
        </p>
      )
    }

    if (type === "activity") {
      const mins =
        d.durationMinutes !== null && d.durationMinutes !== undefined && Number.isFinite(Number(d.durationMinutes))
          ? Number(d.durationMinutes)
          : null
      return mins !== null ? (
        <p className="mt-1 text-sm text-slate-700">
          {mins} {t("units.minutes")}
        </p>
      ) : null
    }

    if (type === "mood" && typeof d.moodValue === "number") {
      return <p className="mt-1 text-sm text-slate-700">{t("common.mood")} {d.moodValue}/5</p>
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
                    {entry.type ? getTypeLabel(t, entry.type) : t("logbook.entry")}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{entry.sourceText}</p>
                  {renderValueHint(entry)}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const d = entry.data as any
                      const implausible =
                        (entry.type === "glucose" && typeof d.value === "number" && d.value > 600) ||
                        (entry.type === "insulin" && typeof d.dose === "number" && d.dose > 100) ||
                        (entry.type === "meal" && typeof d.carbsGrams === "number" && d.carbsGrams > 500)

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

              {renderMiniForm(entry as any, idx)}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            className="flex-1"
            onClick={() => {
              const included = entries.filter((e) => e.included)
              const newEntries = included
                .map((e) => buildNewEntryFromExtracted(e))
                .filter(Boolean) as NewEntry[]
              onSave(newEntries)
            }}
          >
            {t("common.save")}
          </Button>
          <Button variant="ghost" onClick={onDiscard} className="flex-1">
            {t("logbook.discard")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

