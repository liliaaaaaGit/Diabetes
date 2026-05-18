"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/hooks/useTranslation"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { mmolLToMgDl, mgDlToMmolL } from "@/lib/glucose-units"
import type { GlucoseUnit } from "@/lib/types"

export default function SettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { pseudonym } = useUser()
  const {
    preferredUnit,
    displayUnit,
    targetMinMgDl,
    targetMaxMgDl,
    setPreferredUnit,
    setTargetRangeMgDl,
    loading: prefsLoading,
  } = useUserPreferences()

  const [targetMinInput, setTargetMinInput] = useState("")
  const [targetMaxInput, setTargetMaxInput] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (prefsLoading) return
    const toDisplay = (mg: number) =>
      displayUnit === "mmol/L" ? mgDlToMmolL(mg).toFixed(1) : String(Math.round(mg))
    setTargetMinInput(toDisplay(targetMinMgDl))
    setTargetMaxInput(toDisplay(targetMaxMgDl))
  }, [prefsLoading, targetMinMgDl, targetMaxMgDl, displayUnit])

  const handleUnitChange = async (unit: GlucoseUnit) => {
    try {
      await setPreferredUnit(unit)
    } catch {
      toast({ title: t("settings.saveFailed"), variant: "destructive" })
    }
  }

  const saveTargetRange = useCallback(async () => {
    const minDisplay = parseFloat(targetMinInput)
    const maxDisplay = parseFloat(targetMaxInput)
    if (!Number.isFinite(minDisplay) || !Number.isFinite(maxDisplay) || minDisplay >= maxDisplay) {
      toast({ title: t("settings.targetRangeInvalid"), variant: "destructive" })
      return
    }
    const minMg =
      displayUnit === "mmol/L" ? mmolLToMgDl(minDisplay) : Math.round(minDisplay)
    const maxMg =
      displayUnit === "mmol/L" ? mmolLToMgDl(maxDisplay) : Math.round(maxDisplay)
    try {
      await setTargetRangeMgDl(minMg, maxMg)
    } catch {
      toast({ title: t("settings.saveFailed"), variant: "destructive" })
    }
  }, [targetMinInput, targetMaxInput, displayUnit, setTargetRangeMgDl, toast, t])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      if (res.ok) {
        router.push("/login")
        router.refresh()
      } else {
        toast({
          title: t("auth.logoutFailed"),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("auth.logoutFailed"),
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const unitLabel = displayUnit === "mmol/L" ? t("units.mmoll") : t("units.mgdl")

  return (
    <AppShell title={t("pages.settings")}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.preferredUnit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={preferredUnit}
              onValueChange={(v) => void handleUnitChange(v as GlucoseUnit)}
              disabled={prefsLoading}
            >
              <TabsList>
                <TabsTrigger value="mg_dl">{t("units.mgdl")}</TabsTrigger>
                <TabsTrigger value="mmol_l">{t("units.mmoll")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.targetRange")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">
                  {t("settings.min")} ({unitLabel})
                </Label>
                <Input
                  type="number"
                  step={displayUnit === "mmol/L" ? "0.1" : "1"}
                  value={targetMinInput}
                  onChange={(e) => setTargetMinInput(e.target.value)}
                  onBlur={() => void saveTargetRange()}
                  disabled={prefsLoading}
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">
                  {t("settings.max")} ({unitLabel})
                </Label>
                <Input
                  type="number"
                  step={displayUnit === "mmol/L" ? "0.1" : "1"}
                  value={targetMaxInput}
                  onChange={(e) => setTargetMaxInput(e.target.value)}
                  onBlur={() => void saveTargetRange()}
                  disabled={prefsLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.about")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-slate-600">{t("settings.version")}</Label>
              <p className="text-sm text-slate-900 mt-1">{t("settings.appVersion")}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">{t("settings.disclaimer")}</Label>
              <p className="text-sm text-slate-700">{t("safety.disclaimer")}</p>
              <Link
                href="/thesis-info?returnTo=/settings"
                className="text-sm text-teal-600 underline mt-2 inline-block"
              >
                {t("settings.thesisInfo")}
              </Link>
              <Link
                href="/datenschutz?returnTo=/settings"
                className="text-sm text-teal-600 underline mt-3 block"
              >
                {t("settings.openPrivacyPolicy")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pseudonym && (
              <div>
                <Label className="text-sm text-slate-600">{t("settings.loggedInAs")}</Label>
                <p className="text-sm text-slate-900 mt-1 font-medium">{pseudonym}</p>
              </div>
            )}
            <Separator />
            <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" className="w-full">
              {isLoggingOut ? t("common.loading") : t("auth.logout")}
            </Button>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed">
              <p className="font-medium text-slate-700">{t("settings.deleteDataTitle")}</p>
              <p className="mt-1">{t("settings.deleteDataBody")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
