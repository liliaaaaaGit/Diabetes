"use client"

import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"

export function AppFooter() {
  const { t, locale } = useTranslation()

  const impressumHref = locale === "en" ? "/imprint" : "/impressum"
  const privacyHref = locale === "en" ? "/privacy" : "/datenschutz"

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 text-center text-xs text-slate-500">
        <span>{t("safety.notice")}</span>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link
          href={impressumHref}
          className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          {t("legal.impressumLink")}
        </Link>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link
          href={privacyHref}
          className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          {t("legal.privacyLink")}
        </Link>
      </div>
    </footer>
  )
}
