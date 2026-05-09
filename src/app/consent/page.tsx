"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { Droplet } from "lucide-react"

export default function ConsentPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleAgree = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        credentials: "include",
      })
      const data = (await res.json()) as { success?: boolean; error?: string }

      if (data.success) {
        router.push("/")
        router.refresh()
        return
      }

      toast({
        title: t("auth.consentSaveFailed"),
        description: data.error,
        variant: "destructive",
      })
    } catch {
      toast({
        title: t("auth.consentSaveFailed"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      if (res.ok) {
        router.push("/login")
        router.refresh()
      } else {
        toast({ title: t("auth.logoutFailed"), variant: "destructive" })
      }
    } catch {
      toast({ title: t("auth.logoutFailed"), variant: "destructive" })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-white mb-4">
            <Droplet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("auth.consentTitle")}</h1>
          <p className="text-sm text-slate-600">{t("auth.consentAfterRegisterHint")}</p>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="max-h-96 overflow-y-auto pr-2 space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>{t("auth.consentIntro")}</p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelDemo")}:</strong>{" "}
                {t("auth.consentBodyDemo")}
              </p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelYourData")}:</strong>{" "}
                {t("auth.consentBodyYourData")}
              </p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelAI")}:</strong>{" "}
                {t("auth.consentBodyAI")}
              </p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelNotMedical")}:</strong>{" "}
                {t("auth.consentBodyNotMedical")}
              </p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelVoluntary")}:</strong>{" "}
                {t("auth.consentBodyVoluntary")}
              </p>
              <p>
                <strong className="font-semibold text-slate-900">{t("auth.consentLabelDeletion")}:</strong>{" "}
                {t("auth.consentBodyDeletion")}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 space-y-2 text-center">
          <p>
            <Link
              href="/datenschutz?returnTo=/consent"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
            >
              {t("auth.consentPrivacyLink")}
            </Link>
          </p>
          <p>
            <Link
              href="/thesis-info?returnTo=/consent"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
            >
              {t("settings.thesisInfo")}
            </Link>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            onClick={() => void handleAgree()}
            disabled={submitting || loggingOut}
            className="w-full whitespace-normal py-3 h-auto text-sm leading-snug"
          >
            {submitting ? t("common.loading") : t("auth.consentCheckbox")}
          </Button>
          <p className="text-center">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={submitting || loggingOut}
              className="text-sm font-medium text-slate-600 hover:text-teal-700 underline underline-offset-2 disabled:opacity-50"
            >
              {loggingOut ? t("common.loading") : t("auth.logout")}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
