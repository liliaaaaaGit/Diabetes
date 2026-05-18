"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import { UeqScale } from "@/components/questionnaire/ueq-scale"
import { useTranslation } from "@/hooks/useTranslation"
import {
  QUESTIONNAIRE_SECTIONS,
  countAnsweredScaleItems,
  SCALE_ITEM_COUNT,
  nextSection,
  prevSection,
  type QuestionnaireResponse,
  type QuestionnaireSectionId,
} from "@/lib/questionnaire-types"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type Gate = "loading" | "resume" | "completed" | "form" | "thankyou"

const MAX_TEXT = 1000

function emptyResponse(language: "de" | "en"): QuestionnaireResponse {
  return {
    id: "",
    userId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    language,
    lastSection: null,
    durationSeconds: null,
    a1Age: null,
    a2DiabetesType: null,
    a3YearsWithDiabetes: null,
    a4TherapyForm: null,
    a5CurrentToolsCount: null,
    b1Supportive: null,
    b2Easy: null,
    b3Efficient: null,
    b4Clear: null,
    b5Exciting: null,
    b6Interesting: null,
    b7Inventive: null,
    b8Innovative: null,
    c9ConsolidationReplace: null,
    c10ConsolidationOneapp: null,
    c11ConsolidationCgm: null,
    d12BuddyEmpathy: null,
    d13BuddySelfDisclosure: null,
    d14BuddyRoleClarity: null,
    d15BuddyTransparency: null,
    d16BuddyAcceptance: null,
    e17InsightCorrelationAha: null,
    e18InsightUnderstandable: null,
    e19SelfAwareness: null,
    e20EmotionalMarketGap: null,
    e21FreetextExtractionUseful: null,
    f22TrustDataClarity: null,
    f23TrustOverall: null,
    f24PrivacyTextClear: null,
    g25IntentContinue: null,
    g26IntentRecommend: null,
    h27OpenBest: null,
    h28OpenMissed: null,
    h29OpenOneChange: null,
  }
}

function apiToResponse(raw: Record<string, unknown>): QuestionnaireResponse {
  const r = raw as unknown as QuestionnaireResponse
  return { ...emptyResponse(r.language === "en" ? "en" : "de"), ...r }
}

function LikertBlock({
  itemKey,
  field,
  value,
  onChange,
  t,
}: {
  itemKey: string
  field: keyof QuestionnaireResponse
  value: number | null
  onChange: (k: keyof QuestionnaireResponse, v: number) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-800">{t(`questionnaire.items.${itemKey}`)}</p>
      <LikertScale
        name={field}
        minLabel={t("questionnaire.likertMin")}
        maxLabel={t("questionnaire.likertMax")}
        value={value}
        onChange={(v) => onChange(field, v)}
      />
    </div>
  )
}

export function QuestionnaireWizard() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [gate, setGate] = useState<Gate>("loading")
  const [data, setData] = useState<QuestionnaireResponse>(() =>
    emptyResponse(locale === "en" ? "en" : "de")
  )
  const [section, setSection] = useState<QuestionnaireSectionId>("A")
  const [saving, setSaving] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepIndex = QUESTIONNAIRE_SECTIONS.indexOf(section) + 1
  const answeredCount = countAnsweredScaleItems(data)
  const isLast = section === "H"

  const setField = <K extends keyof QuestionnaireResponse>(key: K, value: QuestionnaireResponse[K]) => {
    setData((d) => ({ ...d, [key]: value }))
  }

  const load = useCallback(async () => {
    setGate("loading")
    const res = await fetch("/api/study/questionnaire", { credentials: "include" })
    if (!res.ok) {
      setData(emptyResponse(locale === "en" ? "en" : "de"))
      setGate("form")
      setSection("A")
      return
    }
    const json = (await res.json()) as { response: Record<string, unknown> | null }
    if (!json.response) {
      setData(emptyResponse(locale === "en" ? "en" : "de"))
      setGate("form")
      setSection("A")
      return
    }
    const row = apiToResponse(json.response)
    setData(row)
    if (row.completedAt) {
      setGate("completed")
      return
    }
    if (row.lastSection) {
      setGate("resume")
      return
    }
    setGate("form")
    setSection("A")
  }, [locale])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (nextSectionId: QuestionnaireSectionId, payload: QuestionnaireResponse) => {
    setSaving(true)
    setError(null)
    const res = await fetch("/api/study/questionnaire", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        lastSection: nextSectionId,
        language: locale === "en" ? "en" : "de",
      }),
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
    if (isLast) {
      setSubmitOpen(true)
      return
    }
    const n = nextSection(section)
    if (!n) return
    const ok = await save(n, data)
    if (ok) setSection(n)
  }

  const handleBack = () => {
    const p = prevSection(section)
    if (p) setSection(p)
  }

  const handleSubmit = async () => {
    setSubmitOpen(false)
    setSaving(true)
    setError(null)
    const patchOk = await save("H", data)
    if (!patchOk) {
      setSaving(false)
      return
    }
    const res = await fetch("/api/study/questionnaire/complete", {
      method: "POST",
      credentials: "include",
    })
    setSaving(false)
    if (!res.ok) {
      setError(t("questionnaire.saveError"))
      return
    }
    const json = (await res.json()) as { response: Record<string, unknown> }
    setData(apiToResponse(json.response))
    setGate("thankyou")
    router.refresh()
  }

  const sectionIntro = (id: QuestionnaireSectionId) => {
    const intro = t(`questionnaire.sections.${id}.intro`)
    return intro ? <p className="text-sm text-slate-600 leading-relaxed">{intro}</p> : null
  }

  const renderSection = () => {
    switch (section) {
      case "A":
        return (
          <div className="space-y-5">
            {sectionIntro("A")}
            <p className="text-sm text-slate-700">{t("questionnaire.intro")}</p>
            <div>
              <Label>{t("questionnaire.items.a1")}</Label>
              <Input
                type="number"
                min={0}
                max={120}
                className="mt-2"
                value={data.a1Age ?? ""}
                onChange={(e) =>
                  setField("a1Age", e.target.value === "" ? null : Number(e.target.value))
                }
              />
              <span className="text-xs text-slate-500">{t("questionnaire.items.a1unit")}</span>
            </div>
            <div>
              <Label>{t("questionnaire.items.a2")}</Label>
              <Select
                value={data.a2DiabetesType ?? ""}
                onValueChange={(v) => setField("a2DiabetesType", v as QuestionnaireResponse["a2DiabetesType"])}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
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
                value={data.a3YearsWithDiabetes ?? ""}
                onChange={(e) =>
                  setField(
                    "a3YearsWithDiabetes",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
              <span className="text-xs text-slate-500">{t("questionnaire.items.a3unit")}</span>
            </div>
            <div>
              <Label>{t("questionnaire.items.a4")}</Label>
              <Select
                value={data.a4TherapyForm ?? ""}
                onValueChange={(v) => setField("a4TherapyForm", v as QuestionnaireResponse["a4TherapyForm"])}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
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
              <Select
                value={data.a5CurrentToolsCount ?? ""}
                onValueChange={(v) =>
                  setField("a5CurrentToolsCount", v as QuestionnaireResponse["a5CurrentToolsCount"])
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(["0", "1", "2", "3", "4_plus"] as const).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`questionnaire.options.tools_${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case "B":
        return (
          <div className="space-y-6">
            {sectionIntro("B")}
            <p className="text-xs text-slate-500">{t("questionnaire.ueqHint")}</p>
            {(
              [
                ["b1Supportive", "b1"],
                ["b2Easy", "b2"],
                ["b3Efficient", "b3"],
                ["b4Clear", "b4"],
                ["b5Exciting", "b5"],
                ["b6Interesting", "b6"],
                ["b7Inventive", "b7"],
                ["b8Innovative", "b8"],
              ] as const
            ).map(([field, label]) => (
              <UeqScale
                key={field}
                name={field}
                leftLabel={t(`questionnaire.items.${label}_left`)}
                rightLabel={t(`questionnaire.items.${label}_right`)}
                value={data[field]}
                onChange={(v) => setField(field, v)}
              />
            ))}
          </div>
        )
      case "C":
        return (
          <div className="space-y-6">
            {sectionIntro("C")}
            <LikertBlock itemKey="c9" field="c9ConsolidationReplace" value={data.c9ConsolidationReplace} onChange={setField} t={t} />
            <LikertBlock itemKey="c10" field="c10ConsolidationOneapp" value={data.c10ConsolidationOneapp} onChange={setField} t={t} />
            <LikertBlock itemKey="c11" field="c11ConsolidationCgm" value={data.c11ConsolidationCgm} onChange={setField} t={t} />
          </div>
        )
      case "D":
        return (
          <div className="space-y-6">
            {sectionIntro("D")}
            <LikertBlock itemKey="d12" field="d12BuddyEmpathy" value={data.d12BuddyEmpathy} onChange={setField} t={t} />
            <LikertBlock itemKey="d13" field="d13BuddySelfDisclosure" value={data.d13BuddySelfDisclosure} onChange={setField} t={t} />
            <LikertBlock itemKey="d14" field="d14BuddyRoleClarity" value={data.d14BuddyRoleClarity} onChange={setField} t={t} />
            <LikertBlock itemKey="d15" field="d15BuddyTransparency" value={data.d15BuddyTransparency} onChange={setField} t={t} />
            <LikertBlock itemKey="d16" field="d16BuddyAcceptance" value={data.d16BuddyAcceptance} onChange={setField} t={t} />
          </div>
        )
      case "E":
        return (
          <div className="space-y-6">
            {sectionIntro("E")}
            <LikertBlock itemKey="e17" field="e17InsightCorrelationAha" value={data.e17InsightCorrelationAha} onChange={setField} t={t} />
            <LikertBlock itemKey="e18" field="e18InsightUnderstandable" value={data.e18InsightUnderstandable} onChange={setField} t={t} />
            <LikertBlock itemKey="e19" field="e19SelfAwareness" value={data.e19SelfAwareness} onChange={setField} t={t} />
            <LikertBlock itemKey="e20" field="e20EmotionalMarketGap" value={data.e20EmotionalMarketGap} onChange={setField} t={t} />
            <LikertBlock itemKey="e21" field="e21FreetextExtractionUseful" value={data.e21FreetextExtractionUseful} onChange={setField} t={t} />
          </div>
        )
      case "F":
        return (
          <div className="space-y-6">
            {sectionIntro("F")}
            <LikertBlock itemKey="f22" field="f22TrustDataClarity" value={data.f22TrustDataClarity} onChange={setField} t={t} />
            <LikertBlock itemKey="f23" field="f23TrustOverall" value={data.f23TrustOverall} onChange={setField} t={t} />
            <LikertBlock itemKey="f24" field="f24PrivacyTextClear" value={data.f24PrivacyTextClear} onChange={setField} t={t} />
          </div>
        )
      case "G":
        return (
          <div className="space-y-6">
            {sectionIntro("G")}
            <LikertBlock itemKey="g25" field="g25IntentContinue" value={data.g25IntentContinue} onChange={setField} t={t} />
            <LikertBlock itemKey="g26" field="g26IntentRecommend" value={data.g26IntentRecommend} onChange={setField} t={t} />
          </div>
        )
      case "H":
        return (
          <div className="space-y-5">
            {sectionIntro("H")}
            {(
              [
                ["h27OpenBest", "h27"],
                ["h28OpenMissed", "h28"],
                ["h29OpenOneChange", "h29"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <Label>{t(`questionnaire.items.${label}`)}</Label>
                <Textarea
                  className="mt-2 min-h-[100px]"
                  maxLength={MAX_TEXT}
                  value={data[field] ?? ""}
                  onChange={(e) => setField(field, e.target.value || null)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {t("questionnaire.charCount", {
                    count: (data[field] ?? "").length,
                    max: MAX_TEXT,
                  })}
                </p>
              </div>
            ))}
          </div>
        )
    }
  }

  if (gate === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (gate === "resume") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t("questionnaire.resumeTitle")}</h2>
          <p className="text-sm text-slate-600">
            {t("questionnaire.resumeBody", { section: data.lastSection ?? "A" })}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => {
                setSection(data.lastSection ?? "A")
                setGate("form")
              }}
            >
              {t("questionnaire.resumeYes")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSection("A")
                setGate("form")
              }}
            >
              {t("questionnaire.resumeNo")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gate === "completed") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t("questionnaire.completedTitle")}</h2>
          <p className="text-sm text-slate-600">{t("questionnaire.completedBody")}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setGate("form")}>{t("questionnaire.completedEdit")}</Button>
            <Button variant="outline" onClick={() => setGate("thankyou")}>
              {t("questionnaire.completedViewThanks")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gate === "thankyou") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{t("questionnaire.thankYouTitle")}</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{t("questionnaire.thankYouBody")}</p>
          <p className="text-xs text-slate-500">{t("questionnaire.thankYouHint")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/insights">{t("questionnaire.toInsights")}</Link>
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setGate("form")}>
              {t("questionnaire.reopen")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPct = (stepIndex / QUESTIONNAIRE_SECTIONS.length) * 100

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <div className="mb-2 flex justify-between text-sm text-slate-600">
          <span>{t(`questionnaire.sections.${section}.title`)}</span>
          <span>{t("questionnaire.progress", { current: stepIndex, total: QUESTIONNAIRE_SECTIONS.length })}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">{renderSection()}</CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {submitOpen && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="p-4 space-y-3">
            <p className="font-medium text-slate-900">{t("questionnaire.submitConfirmTitle")}</p>
            <p className="text-sm text-slate-700">
              {t("questionnaire.submitConfirmBody", {
                answered: answeredCount,
                total: SCALE_ITEM_COUNT,
              })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSubmitOpen(false)}>
                {t("questionnaire.submitConfirmNo")}
              </Button>
              <Button className="flex-1" onClick={() => void handleSubmit()} disabled={saving}>
                {t("questionnaire.submitConfirmYes")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!submitOpen && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            disabled={section === "A" || saving}
            onClick={handleBack}
          >
            {t("questionnaire.back")}
          </Button>
          <Button className="min-h-[44px] flex-1" disabled={saving} onClick={() => void handleNext()}>
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
      )}
    </div>
  )
}
