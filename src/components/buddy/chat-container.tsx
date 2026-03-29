"use client"

import { useEffect, useRef } from "react"
import { Message } from "@/lib/types"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"
import { CrisisBanner } from "./crisis-banner"

interface ChatContainerProps {
  messages: Message[]
  showTyping?: boolean
  showCrisisBanner?: boolean
}

export function ChatContainer({
  messages,
  showTyping = false,
  showCrisisBanner = false,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, showTyping])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
    >
      {showCrisisBanner && <CrisisBanner />}

      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const showAssistantAvatar = message.role !== "assistant" || previous?.role !== "assistant"
        return <MessageBubble key={message.id} message={message} showAssistantAvatar={showAssistantAvatar} />
      })}

      {showTyping &&
        (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant") && (
          <TypingIndicator />
        )}
    </div>
  )
}
