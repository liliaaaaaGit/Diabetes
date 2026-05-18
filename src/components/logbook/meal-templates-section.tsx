"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import type { MealTemplate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface MealTemplatesSectionProps {
  onEntryCreated?: () => void
}

export function MealTemplatesSection({ onEntryCreated }: MealTemplatesSectionProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [kh, setKh] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/meal-templates", { credentials: "include" })
      if (!res.ok) return
      const json = (await res.json()) as { templates: MealTemplate[] }
      setTemplates(json.templates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    const khNum = Number(kh)
    if (!name.trim() || !Number.isFinite(khNum)) return
    try {
      const res = await fetch("/api/meal-templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || name.trim(),
          kh: khNum,
        }),
      })
      if (!res.ok) throw new Error("failed")
      setName("")
      setDescription("")
      setKh("")
      setShowForm(false)
      await load()
      toast({ title: t("logbook.templateSaved") })
    } catch {
      toast({ title: t("logbook.templateSaveFailed"), variant: "destructive" })
    }
  }

  const handleQuickAdd = async (templateId: string) => {
    setAddingId(templateId)
    try {
      const res = await fetch("/api/meal-templates/use", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })
      if (!res.ok) throw new Error("failed")
      toast({ title: t("logbook.entrySaved") })
      onEntryCreated?.()
    } catch {
      toast({ title: t("logbook.entrySaved"), variant: "destructive" })
    } finally {
      setAddingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2 mb-3">
        <UtensilsCrossed className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t("logbook.mealTemplatesTitle")}</h2>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t("logbook.mealTemplatesHint")}</p>
        </div>
      </div>

      {!loading && templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {templates.map((tpl) => (
            <Button
              key={tpl.id}
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] text-left h-auto py-2"
              disabled={addingId === tpl.id}
              onClick={() => void handleQuickAdd(tpl.id)}
            >
              <span className="font-medium">{tpl.name}</span>
              <span className="text-xs text-slate-500 ml-1">· {tpl.kh} g KH</span>
            </Button>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div>
            <Label>{t("logbook.templateName")}</Label>
            <Input className="mt-1 min-h-[44px]" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t("logbook.templateDescription")}</Label>
            <Input
              className="mt-1 min-h-[44px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("logbook.templateDescriptionPlaceholder")}
            />
          </div>
          <div>
            <Label>{t("logbook.templateKh")}</Label>
            <Input
              type="number"
              className="mt-1 min-h-[44px]"
              value={kh}
              onChange={(e) => setKh(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1 min-h-[44px]" onClick={() => void handleCreate()}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px] text-teal-700"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("logbook.addMealTemplate")}
        </Button>
      )}
    </section>
  )
}
