"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST", credentials: "include" })
      const data = (await res.json()) as { success: boolean; error?: string }

      if (data.success) {
        router.push("/access")
        router.refresh()
      } else {
        toast({
          title: t("auth.deleteFailed"),
          description: data.error,
          variant: "destructive",
        })
        setShowDeleteDialog(false)
      }
    } catch (error) {
      toast({
        title: t("auth.deleteFailed"),
        variant: "destructive",
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
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
              <a
                href="https://example.com/glucocompanion-thesis"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-teal-600 underline mt-2 inline-block"
              >
                {t("settings.thesisInfo")}
              </a>
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
            <div className="space-y-3">
              <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" className="w-full">
                {isLoggingOut ? t("common.loading") : t("auth.logout")}
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                variant="destructive"
                className="w-full"
              >
                {t("auth.deleteAccount")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.deleteAccountConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("auth.deleteAccountConfirmText")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? t("common.loading") : t("auth.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
