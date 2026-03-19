"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { ArrowLeft } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "./message-bubble"
import { useTranslation } from "@/hooks/useTranslation"

interface ConversationDetailViewProps {
  conversation: Conversation
  onBack: () => void
  onStartFromTopic: () => void
}

export function ConversationDetailView({ conversation, onBack, onStartFromTopic }: ConversationDetailViewProps) {
  const { t } = useTranslation()
  const date = conversation.endedAt || conversation.startedAt
  const dateLabel = date ? format(parseISO(date), "d. MMMM yyyy", { locale: de }) : ""

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <Button type="button" variant="ghost" onClick={onBack} className="rounded-full text-slate-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("buddy.backToBuddy")}
        </Button>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl">{conversation.dominantEmoji || "💬"}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{conversation.title || t("buddy.chat")}</p>
            <p className="text-xs text-slate-500">{dateLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {conversation.messages.map((m, index) => {
          const prev = conversation.messages[index - 1]
          const showAssistantAvatar = m.role !== "assistant" || prev?.role !== "assistant"
          return <MessageBubble key={m.id} message={m} showAssistantAvatar={showAssistantAvatar} />
        })}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">{t("buddy.history.ended")}</p>
        <Button type="button" variant="outline" onClick={onStartFromTopic} className="mt-2">
          {t("buddy.startConversation")}
        </Button>
      </div>
    </div>
  )
}
