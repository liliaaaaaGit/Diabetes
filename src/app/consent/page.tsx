"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/hooks/useTranslation"
import { Droplet } from "lucide-react"

export default function ConsentPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)

  const handleContinue = () => {
    if (accepted) {
      router.push("/register")
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
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto pr-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {t("auth.consentText")}
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
                <Checkbox
                  id="consent"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-sm text-slate-700 cursor-pointer flex-1">
                  {t("auth.consentCheckbox")}
                </label>
              </div>

              <Button onClick={handleContinue} disabled={!accepted} className="w-full">
                {t("auth.continue")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
