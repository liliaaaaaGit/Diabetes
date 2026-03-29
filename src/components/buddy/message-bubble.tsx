"use client"

import { Message } from "@/lib/types"
import { HeartHandshake } from "lucide-react"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"
import { splitBuddySafetyContent, stripChipMarkers } from "@/lib/buddy-message-display"
import { useTranslation } from "@/hooks/useTranslation"

interface MessageBubbleProps {
  message: Message
  showAssistantAvatar?: boolean
}

export function MessageBubble({ message, showAssistantAvatar = true }: MessageBubbleProps) {
  const { t } = useTranslation()
  const isUser = message.role === "user"
  const time = format(parseISO(message.timestamp), "HH:mm", { locale: de })
  const { safety, rest } = isUser ? { safety: null as string | null, rest: message.content } : splitBuddySafetyContent(message.content)
  const displayBody = isUser ? message.content : stripChipMarkers(rest)

  return (
    <div
      className={cn(
        "mb-4 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && showAssistantAvatar && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <HeartHandshake className="h-4 w-4" />
          </div>
        </div>
      )}
      {!isUser && !showAssistantAvatar && <div className="w-7 flex-shrink-0" />}
      <div
        className={cn(
          "max-w-[85%] md:max-w-[80%]",
          isUser && "flex flex-col items-end"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl",
            isUser
              ? "bg-teal-500 text-white rounded-br-sm shadow-sm"
              : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
          )}
        >
          {!isUser && safety ? (
            <div className="mb-3 rounded-lg border-2 border-amber-400/90 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              <p className="font-semibold uppercase tracking-wide text-amber-900">
                {t("buddy.crisis.safetyHeading")}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{safety}</p>
            </div>
          ) : null}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayBody}</p>
        </div>
        <span className="mt-1 px-1 text-xs text-slate-400">
          {time}
        </span>
      </div>
    </div>
  )
}
