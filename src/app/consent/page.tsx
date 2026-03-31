"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { Droplet } from "lucide-react"

export default function ConsentPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleContinue = () => {
    router.push("/register")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-white mb-4">
            <Droplet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("auth.consentTitle")}</h1>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto pr-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {t("auth.consentText")}
              </div>

              <p className="pt-2 text-center">
                <Link
                  href="/privacy"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
                >
                  {t("auth.consentPrivacyLink")}
                </Link>
              </p>

              <div className="pt-4 border-t border-slate-200">
                <Button onClick={handleContinue} className="w-full whitespace-normal py-3 h-auto text-sm leading-snug">
                  {t("auth.consentCheckbox")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
