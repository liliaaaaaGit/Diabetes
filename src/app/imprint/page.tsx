"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/shared/app-shell"
import { ImpressumPolicyContent } from "@/components/legal/impressum-policy-content"
import { useTranslation } from "@/hooks/useTranslation"

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null
  }
  return raw
}

function ImprintInner() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const returnTo = safeReturnPath(searchParams.get("returnTo"))
  const backHref = returnTo ?? "/"

  return (
    <AppShell title={t("pages.impressum")} mainClassName="max-w-3xl">
      <ImpressumPolicyContent />
      <nav className="mt-10 border-t border-slate-200 pt-6" aria-label="Back">
        <Link
          href={backHref}
          className="text-sm font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700"
        >
          {t("auth.privacyBack")}
        </Link>
      </nav>
    </AppShell>
  )
}

function ImprintLoading() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 text-sm text-slate-600">
      {t("common.loading")}
    </div>
  )
}

export default function ImprintPage() {
  return (
    <Suspense fallback={<ImprintLoading />}>
      <ImprintInner />
    </Suspense>
  )
}
