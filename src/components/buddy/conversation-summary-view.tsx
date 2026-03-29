"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { Bot, MessageSquareText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import type { ConversationTag, Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { splitBuddySafetyContent, stripChipMarkers } from "@/lib/buddy-message-display"

export interface ConversationSummaryViewProps {
  title: string
  summary: string
  tags: ConversationTag[]
  /** ISO timestamp (e.g. conversation ended or started) */
  dateIso: string
  messages: Message[]
  onBack: () => void
  /** Optional: second action (e.g. start a new chat from this topic) */
  onStartNewChat?: () => void
}

function formatSummaryDate(iso: string, locale: "de" | "en"): string {
  try {
    const d = parseISO(iso)
    if (locale === "de") {
      return format(d, "EEEE, d. MMMM", { locale: de }).toLowerCase()
    }
    return format(d, "EEEE, MMMM d", { locale: enUS }).toLowerCase()
  } catch {
    return ""
  }
}

export function ConversationSummaryView({
  title,
  summary,
  tags,
  dateIso,
  messages,
  onBack,
  onStartNewChat,
}: ConversationSummaryViewProps) {
  const { t, locale } = useTranslation()
  const dateLabel = formatSummaryDate(dateIso, locale === "de" ? "de" : "en")

  const transcript = messages.filter((m) => m.role === "user" || m.role === "assistant")

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-summary-title"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <h1
            id="conversation-summary-title"
            className="text-3xl font-bold lowercase leading-tight tracking-tight text-slate-900 sm:text-4xl"
          >
            {title.trim() || t("buddy.chat")}
          </h1>

          {dateLabel ? (
            <p className="mt-3 text-sm lowercase text-slate-500">{dateLabel}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {tag.emoji}
                  </span>
                  <span className="lowercase">{tag.label}</span>
                </span>
              ))}
            </div>
          ) : null}

          <p className="mt-8 text-left text-base font-normal leading-relaxed text-slate-800 whitespace-pre-wrap">
            {summary.trim() || t("buddy.summaryView.summaryUnavailable")}
          </p>

          <div className="mt-10 flex items-center gap-2 text-slate-900">
            <MessageSquareText className="h-5 w-5 text-slate-600" aria-hidden />
            <h2 className="text-base font-semibold">{t("buddy.summaryView.messageHistory")}</h2>
          </div>

          <div className="mt-4 space-y-4 border-t border-slate-100 pt-5 pb-8">
            {transcript.map((m, index) => {
              const isUser = m.role === "user"
              const prev = transcript[index - 1]
              const showAssistantAvatar = !isUser && (prev?.role !== "assistant" || index === 0)
              const { safety, rest } = splitBuddySafetyContent(m.content)
              const body = stripChipMarkers(rest)

              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end gap-2">
                    <div className="max-w-[85%] text-right">
                      <div className="inline-block rounded-2xl rounded-br-sm bg-slate-100 px-4 py-2.5 text-left text-sm leading-relaxed text-slate-900">
                        {body}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {format(parseISO(m.timestamp), "HH:mm", { locale: locale === "de" ? de : enUS })}
                      </p>
                    </div>
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                      <User className="h-4 w-4" aria-hidden />
                    </div>
                  </div>
                )
              }

              return (
                <div key={m.id} className={cn("flex gap-2", showAssistantAvatar ? "" : "pl-11")}>
                  {showAssistantAvatar ? (
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-300 text-amber-950">
                      <Bot className="h-4 w-4" aria-hidden />
                    </div>
                  ) : null}
                  <div className="max-w-[85%] min-w-0">
                    <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900">
                      {safety ? (
                        <div className="mb-3 rounded-lg border-2 border-amber-400/90 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                          <p className="font-semibold uppercase tracking-wide text-amber-900">
                            {t("buddy.crisis.safetyHeading")}
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{safety}</p>
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap">{body}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {format(parseISO(m.timestamp), "HH:mm", { locale: locale === "de" ? de : enUS })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:px-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <Button type="button" className="w-full bg-teal-600 hover:bg-teal-700" onClick={onBack}>
            {t("buddy.summaryView.backToBuddy")}
          </Button>
          {onStartNewChat ? (
            <Button type="button" variant="outline" className="w-full" onClick={onStartNewChat}>
              {t("buddy.startConversation")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
