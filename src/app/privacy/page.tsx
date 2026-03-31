"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { ArrowLeft } from "lucide-react"

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null
  }
  return raw
}

function PrivacyContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const returnTo = safeReturnPath(searchParams.get("returnTo"))
  const backHref = returnTo ?? "/consent"
  const backLabel = returnTo === "/settings" ? t("pages.settings") : t("auth.privacyBack")

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 pb-16">
      <div className="mx-auto w-full max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-600" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mb-1">
          {t("auth.privacyDocumentTitle")}
        </h1>

        <Card className="rounded-xl border-slate-200 shadow-sm mt-4">
          <CardContent className="p-5 sm:p-6">
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {t("auth.privacyPolicyFull")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PrivacyLoading() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center text-sm text-slate-600">
      {t("common.loading")}
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<PrivacyLoading />}>
      <PrivacyContent />
    </Suspense>
  )
}
