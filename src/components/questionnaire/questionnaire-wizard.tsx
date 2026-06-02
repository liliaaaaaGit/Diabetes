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
}) {
  const { label, value, onChange } = props
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-800">{label}</p>
      <LikertScale
        name={label}
        minLabel="stimme gar nicht zu"
        maxLabel="stimme voll zu"
        value={value}
        onChange={onChange}
      />
      <p className="text-xs text-slate-500">1 = stimme gar nicht zu · 2 = stimme eher nicht zu · 3 = teils/teils · 4 = stimme eher zu · 5 = stimme voll zu</p>
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
  const [gate, setGate] = useState<Gate>("loading")
  const [data, setData] = useState<QuestionnaireResponse>(() => emptyResponse())
  const [section, setSection] = useState<QuestionnaireSectionId>("A")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sectionTitleMap: Record<QuestionnaireSectionId, string> = {
    A: "Hintergrund",
    B: "System Usability Scale (SUS)",
    C: "Technology Acceptance",
    D: "Gluco",
    E: "Weitere KI-Funktionen",
    F: "Vertrauen & Datenschutz",
    G: "Offene Fragen",
  }

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
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.")
      return false
    }
    const json = (await res.json()) as { response: Record<string, unknown> }
    setData(apiToResponse(json.response))
    return true
  }

  const handleNext = async () => {
    if (!isCurrentSectionComplete) {
      setError("Bitte fülle alle Felder dieses Abschnitts aus.")
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
        setError("Speichern fehlgeschlagen. Bitte erneut versuchen.")
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
    if (section === "A") {
      return (
        <div className="space-y-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Vielen Dank, dass du dir Zeit für diesen Fragebogen nimmst. Er dauert etwa 12 Minuten. Es gibt keine richtigen oder falschen Antworten — uns interessiert dein persönlicher Eindruck. Die in der App angezeigten Werte sind Beispiel-/Demodaten und stammen nicht von dir.
          </p>
          <div>
            <Label>Wie alt bist du?</Label>
            <Input
              type="number"
              min={0}
              max={120}
              className="mt-2"
              value={data.sectionA.age ?? ""}
              onChange={(e) => setSectionA("age", e.target.value === "" ? null : Number(e.target.value))}
            />
            <span className="text-xs text-slate-500">Jahre</span>
          </div>
          <div>
            <Label>Welche Form von Diabetes hast du?</Label>
            <Select value={data.sectionA.diabetes_type ?? ""} onValueChange={(v) => setSectionA("diabetes_type", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="typ1">Typ 1</SelectItem>
                <SelectItem value="typ2">Typ 2</SelectItem>
                <SelectItem value="lada">LADA</SelectItem>
                <SelectItem value="andere">MODY oder anderer Typ</SelectItem>
                <SelectItem value="keine_angabe">keine Angabe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seit wie vielen Jahren hast du Diabetes?</Label>
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
            <span className="text-xs text-slate-500">Jahre</span>
          </div>
          <div>
            <Label>Welche Therapieform nutzt du hauptsächlich?</Label>
            <Select value={data.sectionA.therapy_form ?? ""} onValueChange={(v) => setSectionA("therapy_form", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pen_ict">Insulinpen (ICT)</SelectItem>
                <SelectItem value="pumpe_csii">Insulinpumpe (CSII)</SelectItem>
                <SelectItem value="tabletten">Tabletten</SelectItem>
                <SelectItem value="nur_lebensstil">nur Lebensstil</SelectItem>
                <SelectItem value="keine_angabe">keine Angabe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Wie viele digitale Diabetes-Tools nutzt du aktuell regelmäßig?</Label>
            <Select value={data.sectionA.tools_count ?? ""} onValueChange={(v) => setSectionA("tools_count", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4_plus">4 oder mehr</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Wie häufig nutzt du KI-Chatbots (z. B. ChatGPT) allgemein?</Label>
            <Select value={data.sectionA.ai_usage_general ?? ""} onValueChange={(v) => setSectionA("ai_usage_general", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nie">nie</SelectItem>
                <SelectItem value="selten">selten</SelectItem>
                <SelectItem value="monatlich">monatlich</SelectItem>
                <SelectItem value="woechentlich">wöchentlich</SelectItem>
                <SelectItem value="taeglich">täglich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Hast du KI schon einmal im Zusammenhang mit deinem Diabetes genutzt?</Label>
            <Select value={data.sectionA.ai_usage_diabetes ?? ""} onValueChange={(v) => setSectionA("ai_usage_diabetes", v as any)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ja_regelmaessig">ja, regelmäßig</SelectItem>
                <SelectItem value="ja_ausprobiert">ja, ausprobiert</SelectItem>
                <SelectItem value="nein">nein</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (section === "B") {
      const b = data.sectionB
      return (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Bitte beurteile, wie es dir bei der Nutzung von GlucoCompanion ergangen ist.
          </p>
          <LikertBlock label="1. Ich denke, dass ich GlucoCompanion gerne regelmäßig nutzen würde." value={b.s1} onChange={(v) => setSectionB("s1", v)} />
          <LikertBlock label="2. Ich finde GlucoCompanion unnötig komplex." value={b.s2} onChange={(v) => setSectionB("s2", v)} />
          <LikertBlock label="3. Ich finde GlucoCompanion einfach zu nutzen." value={b.s3} onChange={(v) => setSectionB("s3", v)} />
          <LikertBlock label="4. Ich glaube, ich würde die Unterstützung einer fachkundigen Person benötigen, um GlucoCompanion nutzen zu können." value={b.s4} onChange={(v) => setSectionB("s4", v)} />
          <LikertBlock label="5. Ich finde, dass die verschiedenen Funktionen in GlucoCompanion gut integriert sind." value={b.s5} onChange={(v) => setSectionB("s5", v)} />
          <LikertBlock label="6. Ich finde, dass es in GlucoCompanion zu viele Inkonsistenzen gibt." value={b.s6} onChange={(v) => setSectionB("s6", v)} />
          <LikertBlock label="7. Ich glaube, dass die meisten Menschen sehr schnell lernen würden, mit GlucoCompanion umzugehen." value={b.s7} onChange={(v) => setSectionB("s7", v)} />
          <LikertBlock label="8. Ich finde GlucoCompanion sehr umständlich zu nutzen." value={b.s8} onChange={(v) => setSectionB("s8", v)} />
          <LikertBlock label="9. Ich habe mich bei der Nutzung von GlucoCompanion sehr sicher gefühlt." value={b.s9} onChange={(v) => setSectionB("s9", v)} />
          <LikertBlock label="10. Ich musste viele Dinge lernen, bevor ich mit GlucoCompanion zurechtkam." value={b.s10} onChange={(v) => setSectionB("s10", v)} />
        </div>
      )
    }

    if (section === "C") {
      const c = data.sectionC
      return (
        <div className="space-y-6">
          <p className="rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-sm text-slate-700">
            Die in der App angezeigten Werte sind Beispiel-/Demodaten und stammen nicht von dir.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Die folgenden Aussagen beziehen sich auf deinen Gesamteindruck von GlucoCompanion.
          </p>
          <LikertBlock label="C1. GlucoCompanion wirkt auf mich wie eine sinnvolle Unterstützung für den Diabetes-Alltag." value={c.pu1} onChange={(v) => setSectionC("pu1", v)} />
          <LikertBlock label="C2. Eine App wie GlucoCompanion könnte mir helfen, meinen Diabetes-Alltag einfacher zu bewältigen." value={c.pu2} onChange={(v) => setSectionC("pu2", v)} />
          <LikertBlock label="C3. Mit GlucoCompanion könnte ich Aufgaben rund um meinen Diabetes effizienter erledigen." value={c.pu3} onChange={(v) => setSectionC("pu3", v)} />
          <LikertBlock label="C4. Insgesamt halte ich GlucoCompanion für nützlich." value={c.pu4} onChange={(v) => setSectionC("pu4", v)} />
          <LikertBlock label="C5. Wenn GlucoCompanion verfügbar wäre, könnte ich mir vorstellen, sie zu nutzen." value={c.bi1} onChange={(v) => setSectionC("bi1", v)} />
          <LikertBlock label="C6. Ich würde GlucoCompanion in meinem Diabetes-Alltag eine Chance geben." value={c.bi2} onChange={(v) => setSectionC("bi2", v)} />
          <LikertBlock label="C7. Ich würde GlucoCompanion anderen Menschen mit Diabetes weiterempfehlen." value={c.bi3} onChange={(v) => setSectionC("bi3", v)} />
        </div>
      )
    }

    if (section === "D") {
      const d = data.sectionD
      return (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Gluco ist ein KI-gestützter Chatbot, mit dem du über deinen Alltag mit Diabetes sprechen kannst. Bitte beurteile auf Basis deines Eindrucks aus dem Test.
          </p>
          <LikertBlock label="D1. Gluco hat im Test einfühlsam auf Anliegen reagiert." value={d.d1} onChange={(v) => setSectionD("d1", v)} />
          <LikertBlock label="D2. Ich könnte mir vorstellen, mit Gluco auch über Frustrationen oder Sorgen rund um meinen Diabetes zu sprechen." value={d.d2} onChange={(v) => setSectionD("d2", v)} />
          <LikertBlock label="D3. Ein KI-Begleiter wie Gluco wäre für mich eine sinnvolle Ergänzung zu bestehenden Diabetes-Apps." value={d.d3} onChange={(v) => setSectionD("d3", v)} />
          <LikertBlock label="D4. Für mich war erkennbar, dass Gluco keine medizinischen Dosierungs-Empfehlungen gibt." value={d.mc_role} onChange={(v) => setSectionD("mc_role", v)} />
          <LikertBlock label="D5. Für mich war erkennbar, dass Glucos Antworten von einer KI stammen und nicht fehlerfrei sind." value={d.mc_transparency} onChange={(v) => setSectionD("mc_transparency", v)} />
        </div>
      )
    }

    if (section === "E") {
      const e = data.sectionE
      return (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            GlucoCompanion bietet eine KI-gestützte Tagebuch-Eingabe sowie eine Verknüpfung von Stimmung und Blutzucker. Erinnerung: Die angezeigten Werte sind Demodaten.
          </p>
          <LikertBlock label="E1. Die KI-gestützte Freitext-Eingabe (z.B. „Mittag: Pasta, 60 g KH“) erleichtert die Dokumentation spürbar." value={e.e1} onChange={(v) => setSectionE("e1", v)} />
          <LikertBlock label="E2. Eine automatische Eintrags- und Kohlenhydrat-Erkennung wie hier würde mir im Alltag Zeit sparen." value={e.e2} onChange={(v) => setSectionE("e2", v)} />
          <LikertBlock label="E3. Die Darstellung von Zusammenhängen zwischen Stimmung und Blutzucker ist verständlich und nachvollziehbar." value={e.e3} onChange={(v) => setSectionE("e3", v)} />
          <LikertBlock label="E4. Ich kann mir vorstellen, dass mir eine solche Ansicht mit meinen eigenen Daten neue Zusammenhänge zeigen würde." value={e.e4} onChange={(v) => setSectionE("e4", v)} />
          <LikertBlock label="E5. Eine App, die mehrere Diabetes-Funktionen bündelt, würde meinen Alltag spürbar vereinfachen." value={e.e5} onChange={(v) => setSectionE("e5", v)} />
          <LikertBlock label="E6. GlucoCompanion könnte mehrere der Tools ersetzen oder ergänzen, die ich aktuell nutze." value={e.e6} onChange={(v) => setSectionE("e6", v)} />
        </div>
      )
    }

    if (section === "F") {
      const f = data.sectionF
      return (
        <div className="space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Zum Abschluss noch ein paar Fragen zu Vertrauen und Datenschutz.
          </p>
          <LikertBlock label="F1. Ich vertraue dem Umgang mit meinen Daten in dieser App." value={f.f1} onChange={(v) => setSectionF("f1", v)} />
          <LikertBlock label="F2. Mir ist klar, welche meiner Daten in der App gespeichert werden und welche nicht." value={f.f2} onChange={(v) => setSectionF("f2", v)} />
          <LikertBlock label="F3. Die Hinweise zu Datenschutz und KI sind verständlich formuliert." value={f.f3} onChange={(v) => setSectionF("f3", v)} />
        </div>
      )
    }

    const g = data.sectionG
    return (
      <div className="space-y-5">
        <p className="text-sm text-slate-600 leading-relaxed">
          Zum Schluss würden wir gern deine eigenen Worte hören.
        </p>
        {([
          ["g1", "G1. Was hat dir an GlucoCompanion am besten gefallen?"],
          ["g2", "G2. Was hat dich gestört oder was hast du vermisst?"],
          ["g3", "G3. Wenn du eine einzige Funktion verändern oder ergänzen könntest — welche wäre das?"],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Textarea
              className="mt-2 min-h-[100px]"
              maxLength={MAX_TEXT}
              value={g[key] ?? ""}
              onChange={(e) => setSectionG(key, e.target.value || null)}
            />
            <p className="text-xs text-slate-500 mt-1">{(g[key] ?? "").length} / {MAX_TEXT} Zeichen</p>
          </div>
        ))}
      </div>
    )
  }, [data, section])

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
          <h2 className="text-xl font-bold text-slate-900">Vielen Dank!</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Deine Antworten werden gemeinsam mit denen aller anderen Teilnehmenden anonymisiert ausgewertet und spätestens nach Abschluss der Studie vollständig gelöscht.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => router.push("/")}>
              Schließen
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setGate("form")}>
              Fragebogen erneut öffnen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <div className="mb-2 flex justify-between text-sm text-slate-600">
          <span>{sectionTitleMap[section]}</span>
          <span>Schritt {stepIndex} von 8</span>
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
            Zurück
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
              Wird gespeichert…
            </>
          ) : isLast ? (
            "Absenden"
          ) : (
            "Weiter"
          )}
        </Button>
      </div>
    </div>
  )
}
