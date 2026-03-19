"use client"

import { Conversation } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"
import { ChevronRight } from "lucide-react"

interface ConversationCardProps {
  conversation: Conversation
  onClick: () => void
  isBackfilling?: boolean
}

const moodBorderClass = (emoji?: string) => {
  if (emoji === "😤") return "border-l-orange-400"
  if (emoji === "😢") return "border-l-blue-400"
  if (emoji === "🤔") return "border-l-slate-300"
  if (emoji === "😊") return "border-l-teal-400"
  if (emoji === "😰") return "border-l-amber-400"
  return "border-l-slate-200"
}

export function ConversationCard({ conversation, onClick, isBackfilling = false }: ConversationCardProps) {
  const { t } = useTranslation()
  const getDateLabel = (timestamp: string): string => {
    try {
      const date = parseISO(timestamp)
      return format(date, "d. MMMM yyyy", { locale: de })
    } catch {
      return ""
    }
  }

  return (
    <Card
      className={cn(
        "rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm cursor-pointer transition-colors hover:bg-slate-50",
        moodBorderClass(conversation.dominantEmoji),
        conversation.isActive && "ring-2 ring-teal-100"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="text-2xl leading-none">
              {conversation.dominantEmoji || "💬"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {conversation.title || t("buddy.chat")}
                </h3>
                {conversation.isActive && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                    {t("buddy.history.active")}
                  </span>
                )}
                {isBackfilling && (
                  <span className="text-[10px] text-slate-500 animate-pulse">...</span>
                )}
              </div>

              {conversation.summary && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {conversation.summary}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">
                  {`📅 ${getDateLabel(conversation.endedAt || conversation.startedAt)}`}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500">
                  {`💬 ${conversation.messageCount ?? conversation.messages.length ?? 0} `}
                  {t("buddy.history.messages")}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
