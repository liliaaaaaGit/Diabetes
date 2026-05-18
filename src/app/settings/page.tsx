"use client"

import { useState } from "react"
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
import { TARGET_RANGE } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"

export default function SettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { pseudonym } = useUser()
  const [unit, setUnit] = useState<"mg_dl" | "mmol_l">("mg_dl")
  const [targetMin, setTargetMin] = useState<number>(TARGET_RANGE.low)
  const [targetMax, setTargetMax] = useState<number>(TARGET_RANGE.high)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    } catch (error) {
      toast({
        title: t("auth.logoutFailed"),
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AppShell title={t("pages.settings")}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Preferred Unit */}
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.preferredUnit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={unit} onValueChange={(v) => setUnit(v as "mg_dl" | "mmol_l")}>
              <TabsList>
                <TabsTrigger value="mg_dl">{t("units.mgdl")}</TabsTrigger>
                <TabsTrigger value="mmol_l">{t("units.mmoll")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* Target Range */}
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("settings.targetRange")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">
                  {t("settings.min")} ({t("units.mgdl")})
                </Label>
                <Input
                  type="number"
                  value={targetMin}
                  onChange={(e) => setTargetMin(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">
                  {t("settings.max")} ({t("units.mgdl")})
                </Label>
                <Input
                  type="number"
                  value={targetMax}
                  onChange={(e) => setTargetMax(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
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
              <Label className="text-sm text-slate-600 mb-2 block">
                {t("settings.disclaimer")}
              </Label>
              <p className="text-sm text-slate-700">
                {t("safety.disclaimer")}
              </p>
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

        {/* Account */}
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
