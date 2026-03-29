"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface MotivationQuoteProps {
  quote: string
  onRefresh: () => void
  loading?: boolean
  /** i18n key for the section heading (default: thought of the day). */
  titleKey?: string
  /** `teal` matches Buddy home / stats; `amber` is the classic warm card. */
  variant?: "amber" | "teal"
}

export function MotivationQuote({
  quote,
  onRefresh,
  loading = false,
  titleKey = "buddy.thoughtOfDay",
  variant = "amber",
}: MotivationQuoteProps) {
  const { t } = useTranslation()
  const isTeal = variant === "teal"

  return (
    <section
      className={cn(
        "rounded-xl p-5 shadow-sm",
        isTeal
          ? "border border-teal-500/20 bg-teal-500/10 ring-1 ring-teal-500/15"
          : "border border-amber-100 bg-amber-50"
      )}
    >
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
          className={cn(
            "h-10 w-10 rounded-full",
            isTeal ? "text-teal-600 hover:bg-teal-500/15" : "text-amber-700 hover:bg-amber-100"
          )}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className={cn("mt-4 text-4xl leading-none", isTeal ? "text-teal-500" : "text-amber-300")}>&ldquo;</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">{quote}</p>
      <p className={cn("mt-2 text-right text-4xl leading-none", isTeal ? "text-teal-500" : "text-amber-300")}>&rdquo;</p>
    </section>
  )
}
