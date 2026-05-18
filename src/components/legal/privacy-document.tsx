"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content"
import { ArrowLeft } from "lucide-react"

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null
  }
  return raw
}

export function PrivacyDocumentBody() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const returnTo = safeReturnPath(searchParams.get("returnTo"))
  const backHref = returnTo ?? "/consent"
  const backLabel = returnTo === "/settings" ? t("pages.settings") : t("auth.privacyBack")

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl xl:max-w-7xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-600" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <Card className="rounded-xl border-slate-200 shadow-sm mt-4">
          <CardContent className="p-5 sm:p-6">
            <PrivacyPolicyContent />
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

export function PrivacyDocumentPage() {
  return (
    <Suspense fallback={<PrivacyLoading />}>
      <PrivacyDocumentBody />
    </Suspense>
  )
}
