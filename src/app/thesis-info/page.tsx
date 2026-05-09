"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThesisInfoContent } from "@/components/legal/thesis-info-content"
import { useTranslation } from "@/hooks/useTranslation"

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null
  }
  return raw
}

function ThesisInfoInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const returnTo = safeReturnPath(searchParams.get("returnTo"))
  const backHref = returnTo ?? "/"

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <ThesisInfoContent />
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button asChild className="rounded-full px-8">
            <Link href={backHref}>{t("thesisInfoPage.backToApp")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ThesisInfoLoading() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center text-sm text-slate-600">
      {t("common.loading")}
    </div>
  )
}

export default function ThesisInfoPage() {
  return (
    <Suspense fallback={<ThesisInfoLoading />}>
      <ThesisInfoInner />
    </Suspense>
  )
}
