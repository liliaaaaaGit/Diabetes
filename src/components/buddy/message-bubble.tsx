"use client"

import { Message } from "@/lib/types"
import { HeartHandshake } from "lucide-react"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  showAssistantAvatar?: boolean
}

export function MessageBubble({ message, showAssistantAvatar = true }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const time = format(parseISO(message.timestamp), "HH:mm", { locale: de })

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
              ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-br-sm shadow-sm"
              : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="mt-1 px-1 text-xs text-slate-400">
          {time}
        </span>
      </div>
    </div>
  )
}
