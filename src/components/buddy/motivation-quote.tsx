"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"

interface MotivationQuoteProps {
  quote: string
  onRefresh: () => void
  loading?: boolean
  /** i18n key for the section heading (default: thought of the day). */
  titleKey?: string
}

export function MotivationQuote({
  quote,
  onRefresh,
  loading = false,
  titleKey = "buddy.thoughtOfDay",
}: MotivationQuoteProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t(titleKey)}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-10 w-10 rounded-full text-amber-700 hover:bg-amber-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-4 text-4xl leading-none text-amber-300">&ldquo;</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">{quote}</p>
      <p className="mt-2 text-right text-4xl leading-none text-amber-300">&rdquo;</p>
    </section>
  )
}
