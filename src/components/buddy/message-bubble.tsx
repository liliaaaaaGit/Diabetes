"use client"

import { Message } from "@/lib/types"
import { Bot } from "lucide-react"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const time = format(parseISO(message.timestamp), "HH:mm", { locale: de })

  return (
    <div
      className={cn(
        "flex gap-2 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%]",
          isUser && "flex flex-col items-end"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl",
            isUser
              ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-br-sm shadow-sm"
              : "bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200/60"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-slate-500 mt-1 px-1">
          {time}
        </span>
      </div>
    </div>
  )
}
