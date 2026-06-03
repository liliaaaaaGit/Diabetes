"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LikertScale } from "@/components/questionnaire/likert-scale"
import {
  QUESTIONNAIRE_SECTIONS,
  LIKERT_VALUES,
  nextSection,
  prevSection,
  type QuestionnairePatch,
  type QuestionnaireResponse,
  type QuestionnaireSectionId,
} from "@/lib/questionnaire-types"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

type Gate = "loading" | "form" | "thankyou"

const MAX_TEXT = 1000

function emptyResponse(): QuestionnaireResponse {
  return {
    id: "",
    userId: "",
    createdAt: new Date().toISOString(),
    completedAt: null,
    sectionA: {
      age: null,
      diabetes_type: null,
      years_with_diabetes: null,
      therapy_form: null,
      tools_count: null,
      ai_usage_general: null,
      ai_usage_diabetes: null,
    },
    sectionB: { s1: null, s2: null, s3: null, s4: null, s5: null, s6: null, s7: null, s8: null, s9: null, s10: null },
    sectionC: { pu1: null, pu2: null, pu3: null, pu4: null, bi1: null, bi2: null, bi3: null },
    sectionD: { d1: null, d2: null, d3: null, mc_role: null, mc_transparency: null },
    sectionE: { e1: null, e2: null, e3: null, e4: null, e5: null, e6: null },
    sectionF: { f1: null, f2: null, f3: null },
    sectionG: { g1: null, g2: null, g3: null },
  }
}

function apiToResponse(raw: Record<string, unknown>): QuestionnaireResponse {
  const r = raw as unknown as Partial<QuestionnaireResponse>
  return {
    ...emptyResponse(),
    ...r,
    sectionA: { ...emptyResponse().sectionA, ...(r.sectionA ?? {}) },
    sectionB: { ...emptyResponse().sectionB, ...(r.sectionB ?? {}) },
    sectionC: { ...emptyResponse().sectionC, ...(r.sectionC ?? {}) },
    sectionD: { ...emptyResponse().sectionD, ...(r.sectionD ?? {}) },
    sectionE: { ...emptyResponse().sectionE, ...(r.sectionE ?? {}) },
    sectionF: { ...emptyResponse().sectionF, ...(r.sectionF ?? {}) },
    sectionG: { ...emptyResponse().sectionG, ...(r.sectionG ?? {}) },
  }
}

function LikertBlock(props: {
  label: string
  value: number | null
  onChange: (v: number) => void
  minLabel: string
  maxLabel: string
  legend: string
}) {
  const { label, value, onChange, minLabel, maxLabel, legend } = props
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-800">{label}</p>
      <LikertScale
        name={label}
        minLabel={minLabel}
        maxLabel={maxLabel}
        value={value}
        onChange={onChange}
      />
      <p className="text-xs text-slate-500">{legend}</p>
    </div>
  )
}

function isFilledLikert(v: number | null) {
  return v != null && LIKERT_VALUES.includes(v as (typeof LIKERT_VALUES)[number])
}

function isFilledText(v: string | null) {
  return Boolean(v && v.trim().length > 0)
}

function sectionComplete(section: QuestionnaireSectionId, data: QuestionnaireResponse): boolean {
  if (section === "A") {
    const a = data.sectionA
    return Boolean(
      a.age != null &&
        a.diabetes_type &&
        a.years_with_diabetes != null &&
        a.therapy_form &&
        a.tools_count &&
        a.ai_usage_general &&
        a.ai_usage_diabetes
    )
  }
  if (section === "B") return Object.values(data.sectionB).every((v) => isFilledLikert(v))
  if (section === "C") return Object.values(data.sectionC).every((v) => isFilledLikert(v))
  if (section === "D") return Object.values(data.sectionD).every((v) => isFilledLikert(v))
  if (section === "E") return Object.values(data.sectionE).every((v) => isFilledLikert(v))
  if (section === "F") return Object.values(data.sectionF).every((v) => isFilledLikert(v))
  return Object.values(data.sectionG).every((v) => isFilledText(v))
}

function sectionPatch(section: QuestionnaireSectionId, data: QuestionnaireResponse): QuestionnairePatch {
  if (section === "A") return { sectionA: data.sectionA }
  if (section === "B") return { sectionB: data.sectionB }
  if (section === "C") return { sectionC: data.sectionC }
  if (section === "D") return { sectionD: data.sectionD }
  if (section === "E") return { sectionE: data.sectionE }
  if (section === "F") return { sectionF: data.sectionF }
  return { sectionG: data.sectionG }
}

export function QuestionnaireWizard() {
  const router = useRouter()
  const { t } = useTranslation()
  const [gate, setGate] = useState<Gate>("loading")
  const [data, setData] = useState<QuestionnaireResponse>(() => emptyResponse())
  const [section, setSection] = useState<QuestionnaireSectionId>("A")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const likertMin = t("questionnaire.likertMin")
  const likertMax = t("questionnaire.likertMax")
  const likertLegend = t("questionnaire.likertLegend")

  const stepIndex = QUESTIONNAIRE_SECTIONS.indexOf(section) + 1
  const isLast = section === "G"
  const isCurrentSectionComplete = sectionComplete(section, data)
  const progressPct = (stepIndex / 7) * 100

  const load = useCallback(async () => {
    setGate("loading")
    const res = await fetch("/api/questionnaire", { credentials: "include" })
    if (!res.ok) {
      setData(emptyResponse())
      setGate("form")
      setSection("A")
      return
    }
    const json = (await res.json()) as { response: Record<string, unknown> | null }
    if (!json.response) {
      setData(emptyResponse())
      setGate("form")
      setSection("A")
      return
    }
    const row = apiToResponse(json.response)
    setData(row)
    if (row.completedAt) {
      setGate("thankyou")
      return
    }
    setGate("form")
    setSection("A")
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveSection = async (sectionId: QuestionnaireSectionId) => {
    setSaving(true)
    setError(null)
    const res = await fetch("/api/questionnaire", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionPatch(sectionId, data)),
    })
    setSaving(false)
    if (!res.ok) {
      setError(t("questionnaire.saveError"))
      return false
    }
    const json = (await res.json()) as { response: Record<string, unknown> }
    setData(apiToResponse(json.response))
    return true
  }

  const handleNext = async () => {
    if (!isCurrentSectionComplete) {
      setError(t("questionnaire.incompleteSection"))
      return
    }
    const ok = await saveSection(section)
    if (!ok) return
    if (isLast) {
      const complete = await fetch("/api/study/questionnaire/complete", {
        method: "POST",
        credentials: "include",
      })
      if (!complete.ok) {
        setError(t("questionnaire.saveError"))
        return
      }
      setGate("thankyou")
      router.refresh()
      return
    }
    const next = nextSection(section)
    if (next) setSection(next)
  }

  const handleBack = () => {
    const prev = prevSection(section)
    if (prev) setSection(prev)
  }

  const setSectionA = <K extends keyof QuestionnaireResponse["sectionA"]>(
    key: K,
    value: QuestionnaireResponse["sectionA"][K]
  ) => {
    setData((d) => ({ ...d, sectionA: { ...d.sectionA, [key]: value } }))
  }
  const setSectionB = <K extends keyof QuestionnaireResponse["sectionB"]>(
    key: K,
    value: QuestionnaireResponse["sectionB"][K]
  ) => {
    setData((d) => ({ ...d, sectionB: { ...d.sectionB, [key]: value } }))
  }
  const setSectionC = <K extends keyof QuestionnaireResponse["sectionC"]>(
    key: K,
    value: QuestionnaireResponse["sectionC"][K]
  ) => {
    setData((d) => ({ ...d, sectionC: { ...d.sectionC, [key]: value } }))
  }
  const setSectionD = <K extends keyof QuestionnaireResponse["sectionD"]>(
    key: K,
    value: QuestionnaireResponse["sectionD"][K]
  ) => {
    setData((d) => ({ ...d, sectionD: { ...d.sectionD, [key]: value } }))
  }
  const setSectionE = <K extends keyof QuestionnaireResponse["sectionE"]>(
    key: K,
    value: QuestionnaireResponse["sectionE"][K]
  ) => {
    setData((d) => ({ ...d, sectionE: { ...d.sectionE, [key]: value } }))
  }
  const setSectionF = <K extends keyof QuestionnaireResponse["sectionF"]>(
    key: K,
    value: QuestionnaireResponse["sectionF"][K]
  ) => {
    setData((d) => ({ ...d, sectionF: { ...d.sectionF, [key]: value } }))
  }
  const setSectionG = <K extends keyof QuestionnaireResponse["sectionG"]>(
    key: K,
    value: QuestionnaireResponse["sectionG"][K]
  ) => {
    setData((d) => ({ ...d, sectionG: { ...d.sectionG, [key]: value } }))
  }

  const renderSection = useMemo(() => {
    const likert = { minLabel: likertMin, maxLabel: likertMax, legend: likertLegend }

    if (section === "A") {
      return (
        <div className="space-y-5">
          <p className="text-sm text-slate-700 leading-relaxed">{t("questionnaire.sectionAIntro")}</p>
          <div>
            <Label>{t("questionnaire.items.a1")}</Label>
            <Input
              type="number"
              min={0}
              max={120}
              className="mt-2"
              value={data.sectionA.age ?? ""}
              onChange={(e) => setSectionA("age", e.target.value === "" ? null : Number(e.target.value))}
            />
            <span className="text-xs text-slate-500">{t("questionnaire.items.a1unit")}</span>
          </div>
          <div>
            <Label>{t("questionnaire.items.a2")}</Label>
            <Select value={data.sectionA.diabetes_type ?? ""} onValueChange={(v) => setSectionA("diabetes_type", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="typ1">{t("questionnaire.options.diabetes_typ1")}</SelectItem>
                <SelectItem value="typ2">{t("questionnaire.options.diabetes_typ2")}</SelectItem>
                <SelectItem value="lada">{t("questionnaire.options.diabetes_lada")}</SelectItem>
                <SelectItem value="andere">{t("questionnaire.options.diabetes_andere")}</SelectItem>
                <SelectItem value="keine_angabe">{t("questionnaire.options.diabetes_keine_angabe")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("questionnaire.items.a3")}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              className="mt-2"
              value={data.sectionA.years_with_diabetes ?? ""}
              onChange={(e) =>
                setSectionA("years_with_diabetes", e.target.value === "" ? null : Number(e.target.value))
              }
            />
            <span className="text-xs text-slate-500">{t("questionnaire.items.a3unit")}</span>
          </div>
          <div>
            <Label>{t("questionnaire.items.a4")}</Label>
            <Select value={data.sectionA.therapy_form ?? ""} onValueChange={(v) => setSectionA("therapy_form", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pen_ict">{t("questionnaire.options.therapy_pen")}</SelectItem>
                <SelectItem value="pumpe_csii">{t("questionnaire.options.therapy_pumpe")}</SelectItem>
                <SelectItem value="tabletten">{t("questionnaire.options.therapy_tabletten")}</SelectItem>
                <SelectItem value="nur_lebensstil">{t("questionnaire.options.therapy_lifestyle")}</SelectItem>
                <SelectItem value="keine_angabe">{t("questionnaire.options.therapy_keine_angabe")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("questionnaire.items.a5")}</Label>
            <Select value={data.sectionA.tools_count ?? ""} onValueChange={(v) => setSectionA("tools_count", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("questionnaire.options.tools_0")}</SelectItem>
                <SelectItem value="1">{t("questionnaire.options.tools_1")}</SelectItem>
                <SelectItem value="2">{t("questionnaire.options.tools_2")}</SelectItem>
                <SelectItem value="3">{t("questionnaire.options.tools_3")}</SelectItem>
                <SelectItem value="4_plus">{t("questionnaire.options.tools_4_plus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("questionnaire.items.a6")}</Label>
            <Select value={data.sectionA.ai_usage_general ?? ""} onValueChange={(v) => setSectionA("ai_usage_general", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nie">{t("questionnaire.options.ai_nie")}</SelectItem>
                <SelectItem value="selten">{t("questionnaire.options.ai_selten")}</SelectItem>
                <SelectItem value="monatlich">{t("questionnaire.options.ai_monatlich")}</SelectItem>
                <SelectItem value="woechentlich">{t("questionnaire.options.ai_woechentlich")}</SelectItem>
                <SelectItem value="taeglich">{t("questionnaire.options.ai_taeglich")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("questionnaire.items.a7")}</Label>
            <Select value={data.sectionA.ai_usage_diabetes ?? ""} onValueChange={(v) => setSectionA("ai_usage_diabetes", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ja_regelmaessig">{t("questionnaire.options.ai_ja_regelmaessig")}</SelectItem>
                <SelectItem value="ja_ausprobiert">{t("questionnaire.options.ai_ja_ausprobiert")}</SelectItem>
                <SelectItem value="nein">{t("questionnaire.options.ai_nein")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (section === "B") {
      const b = data.sectionB
      const intro = t(`questionnaire.sections.B.intro`)
      return (
        <div className="space-y-6">
          {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
          {(
            [
              ["s1", "sus1"],
              ["s2", "sus2"],
              ["s3", "sus3"],
              ["s4", "sus4"],
              ["s5", "sus5"],
              ["s6", "sus6"],
              ["s7", "sus7"],
              ["s8", "sus8"],
              ["s9", "sus9"],
              ["s10", "sus10"],
            ] as const
          ).map(([field, itemKey]) => (
            <LikertBlock
              key={field}
              label={t(`questionnaire.items.${itemKey}`)}
              value={b[field]}
              onChange={(v) => setSectionB(field, v)}
              {...likert}
            />
          ))}
        </div>
      )
    }

    if (section === "C") {
      const c = data.sectionC
      const intro = t(`questionnaire.sections.C.intro`)
      return (
        <div className="space-y-6">
          <p className="rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-sm text-slate-700">
            {t("questionnaire.demoBanner")}
          </p>
          {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
          {(
            [
              ["pu1", "pu1"],
              ["pu2", "pu2"],
              ["pu3", "pu3"],
              ["pu4", "pu4"],
              ["bi1", "bi1"],
              ["bi2", "bi2"],
              ["bi3", "bi3"],
            ] as const
          ).map(([field, itemKey]) => (
            <LikertBlock
              key={field}
              label={t(`questionnaire.items.${itemKey}`)}
              value={c[field]}
              onChange={(v) => setSectionC(field, v)}
              {...likert}
            />
          ))}
        </div>
      )
    }

    if (section === "D") {
      const d = data.sectionD
      const intro = t(`questionnaire.sections.D.intro`)
      return (
        <div className="space-y-6">
          {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
          {(
            [
              ["d1", "d1"],
              ["d2", "d2"],
              ["d3", "d3"],
              ["mc_role", "d4"],
              ["mc_transparency", "d5"],
            ] as const
          ).map(([field, itemKey]) => (
            <LikertBlock
              key={field}
              label={t(`questionnaire.items.${itemKey}`)}
              value={d[field]}
              onChange={(v) => setSectionD(field, v)}
              {...likert}
            />
          ))}
        </div>
      )
    }

    if (section === "E") {
      const e = data.sectionE
      const intro = t(`questionnaire.sections.E.intro`)
      return (
        <div className="space-y-6">
          <p className="rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-sm text-slate-700">
            {t("questionnaire.demoBanner")}
          </p>
          {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
          {(["e1", "e2", "e3", "e4", "e5", "e6"] as const).map((key) => (
            <LikertBlock
              key={key}
              label={t(`questionnaire.items.${key}`)}
              value={e[key]}
              onChange={(v) => setSectionE(key, v)}
              {...likert}
            />
          ))}
        </div>
      )
    }

    if (section === "F") {
      const f = data.sectionF
      const intro = t(`questionnaire.sections.F.intro`)
      return (
        <div className="space-y-6">
          {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
          {(["f1", "f2", "f3"] as const).map((key) => (
            <LikertBlock
              key={key}
              label={t(`questionnaire.items.${key}`)}
              value={f[key]}
              onChange={(v) => setSectionF(key, v)}
              {...likert}
            />
          ))}
        </div>
      )
    }

    const g = data.sectionG
    const intro = t(`questionnaire.sections.G.intro`)
    return (
      <div className="space-y-5">
        {intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null}
        {(
          [
            ["g1", "h27"],
            ["g2", "h28"],
            ["g3", "h29"],
          ] as const
        ).map(([field, itemKey]) => (
          <div key={field}>
            <Label>{t(`questionnaire.items.${itemKey}`)}</Label>
            <Textarea
              className="mt-2 min-h-[100px]"
              maxLength={MAX_TEXT}
              value={g[field] ?? ""}
              onChange={(e) => setSectionG(field, e.target.value || null)}
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("questionnaire.charCount", { count: (g[field] ?? "").length, max: MAX_TEXT })}
            </p>
          </div>
        ))}
      </div>
    )
  }, [data, section, t, likertMin, likertMax, likertLegend])

  if (gate === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (gate === "thankyou") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{t("questionnaire.thankYouTitle")}</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{t("questionnaire.thankYouBody")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => router.push("/")}>
              {t("questionnaire.close")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setGate("form")}>
              {t("questionnaire.reopenWizard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sectionTitle = t(`questionnaire.sections.${section}.title`)

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <div className="mb-2 flex justify-between text-sm text-slate-600">
          <span>{sectionTitle}</span>
          <span>{t("questionnaire.progress", { current: stepIndex, total: 8 })}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">{renderSection}</CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        {stepIndex > 1 ? (
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            disabled={saving}
            onClick={handleBack}
          >
            {t("questionnaire.back")}
          </Button>
        ) : null}
        <Button
          className="min-h-[44px] flex-1"
          disabled={saving || !isCurrentSectionComplete}
          onClick={() => void handleNext()}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("questionnaire.saving")}
            </>
          ) : isLast ? (
            t("questionnaire.submit")
          ) : (
            t("questionnaire.next")
          )}
        </Button>
      </div>
    </div>
  )
}
