"use client"

import { useEffect, useRef } from "react"
import { Message } from "@/lib/types"
import { MessageBubble } from "./message-bubble"
import { AssistantIntroCard } from "./assistant-intro-card"
import { SuggestionChips } from "./suggestion-chips"
import { TypingIndicator } from "./typing-indicator"
import { CrisisBanner } from "./crisis-banner"

interface ChatContainerProps {
  messages: Message[]
  onSuggestionSelect: (text: string) => void
  showTyping?: boolean
  contextualSuggestions?: string[]
  showCrisisBanner?: boolean
}

export function ChatContainer({
  messages,
  onSuggestionSelect,
  showTyping = false,
  contextualSuggestions = [],
  showCrisisBanner = false,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

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
      {showCrisisBanner && <CrisisBanner />}
      {showIntro && <AssistantIntroCard />}
      {showSuggestions && messages.length === 0 && (
        <SuggestionChips onSelect={onSuggestionSelect} />
      )}

      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const showAssistantAvatar = message.role !== "assistant" || previous?.role !== "assistant"
        return <MessageBubble key={message.id} message={message} showAssistantAvatar={showAssistantAvatar} />
      })}

      {showTyping && <TypingIndicator />}

      {showSuggestions && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && contextualSuggestions.length > 0 && (
        <SuggestionChips onSelect={onSuggestionSelect} suggestions={contextualSuggestions} />
      )}
    </div>
  )
}
