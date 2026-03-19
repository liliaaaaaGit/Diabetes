"use client"

import { Conversation } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"
import { ChevronRight } from "lucide-react"

interface ConversationCardProps {
  conversation: Conversation
  onClick: () => void
}

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const { t } = useTranslation()
  const getRelativeTime = (timestamp: string): string => {
    try {
      const date = parseISO(timestamp)
      return formatDistanceToNow(date, { addSuffix: true, locale: de })
    } catch {
      return ""
    }
  }

  return (
    <Card
      className={cn(
        "rounded-xl bg-white border border-slate-200 shadow-sm cursor-pointer transition-all",
        conversation.isActive ? "ring-2 ring-blue-100" : "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
              {conversation.dominantEmoji || "💬"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {conversation.title || t("buddy.chat")}
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              </div>

              {conversation.summary && (
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {conversation.summary}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">
                  {getRelativeTime(conversation.startedAt)}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500">
                  {conversation.messageCount ?? conversation.messages.length ?? 0}{" "}
                  {t("buddy.messages")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
