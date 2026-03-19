"use client"

import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"
import { Message } from "@/lib/types"
import { MessageBubble } from "./message-bubble"
import { AssistantIntroCard } from "./assistant-intro-card"
import { SuggestionChips } from "./suggestion-chips"
import { useTranslation } from "@/hooks/useTranslation"

interface ChatContainerProps {
  messages: Message[]
  onSuggestionSelect: (text: string) => void
  showTyping?: boolean
}

export function ChatContainer({
  messages,
  onSuggestionSelect,
  showTyping = false,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, showTyping])

  const showIntro = messages.length === 0
  const showSuggestions = messages.length === 0 || messages[messages.length - 1]?.role === "assistant"

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
    >
      {showIntro && <AssistantIntroCard />}
      {showSuggestions && messages.length === 0 && (
        <SuggestionChips onSelect={onSuggestionSelect} />
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {showTyping && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
          <div className="flex-shrink-0 mt-1">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
            <div className="flex gap-1">
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          </div>
          <div className="text-xs text-slate-500">{t("buddy.typing")}</div>
        </div>
      )}

      {showSuggestions && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
        <SuggestionChips onSelect={onSuggestionSelect} />
      )}
    </div>
  )
}
