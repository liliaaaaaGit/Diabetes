"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { ChevronRight, History, RefreshCw } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { cn } from "@/lib/utils"
import { conversationSummaryLooksLegacy } from "@/lib/conversation-summary-legacy"
import { useTranslation } from "@/hooks/useTranslation"

function formatHistoryCardDate(iso: string, locale: "de" | "en"): string {
  try {
    const d = parseISO(iso)
    if (locale === "de") {
      return format(d, "d. MMMM yyyy", { locale: de })
    }
    return format(d, "MMM d, yyyy", { locale: enUS })
  } catch {
    return ""
  }
}

interface HistoryConversationCardProps {
  conversation: Conversation
  displayTitle: string
  fallbackTitle?: string
  onOpen: () => void
  onRefreshSummary?: (e: React.MouseEvent) => void
  isRefreshing?: boolean
  isBackfilling?: boolean
}

export function HistoryConversationCard({
  conversation,
  displayTitle,
  fallbackTitle,
  onOpen,
  onRefreshSummary,
  isRefreshing = false,
  isBackfilling = false,
}: HistoryConversationCardProps) {
  const { t, locale } = useTranslation()
  const dateSource = conversation.endedAt || conversation.startedAt
  const dateLabel = dateSource ? formatHistoryCardDate(dateSource, locale === "de" ? "de" : "en") : ""

  const title = (displayTitle || fallbackTitle || t("buddy.chat")).trim()
  const preview = conversation.summary?.trim() || ""
  const legacy = conversationSummaryLooksLegacy(conversation)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-shadow",
        "hover:border-slate-300 hover:shadow-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
        conversation.isActive && "ring-1 ring-teal-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-base font-bold leading-snug tracking-tight text-slate-900">
          {title}
          {isBackfilling && (
            <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 align-middle" />
          )}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {legacy && onRefreshSummary ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRefreshSummary(e)
              }}
              disabled={isRefreshing}
              className={cn(
                "inline-flex rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-600",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-500",
                isRefreshing && "pointer-events-none text-teal-600"
              )}
              title={t("buddy.history.refreshSummary")}
              aria-label={t("buddy.history.refreshSummary")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} aria-hidden />
            </button>
          ) : null}
          {dateLabel ? (
            <span className="text-xs font-normal text-slate-500">{dateLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {preview ? preview : <span className="text-slate-400">{t("buddy.history.noPreview")}</span>}
        </p>
        <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      </div>
    </div>
  )
}

/** Section title row for the history tab. */
export function HistoryListHeader() {
  const { t } = useTranslation()
  return (
    <div className="mb-4 flex items-center gap-2">
      <History className="h-5 w-5 text-slate-600" aria-hidden />
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{t("buddy.history.listTitle")}</h2>
    </div>
  )
}
