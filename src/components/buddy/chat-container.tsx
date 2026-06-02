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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const run = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
    requestAnimationFrame(run)
  }, [messages, showTyping])

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
      <div className="space-y-4">
        {showCrisisBanner && <CrisisBanner />}

        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const showAssistantAvatar = message.role !== "assistant" || previous?.role !== "assistant"
          return (
            <MessageBubble key={message.id} message={message} showAssistantAvatar={showAssistantAvatar} />
          )
        })}

        {showTyping &&
          (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant") && (
            <TypingIndicator />
          )}

        <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
      </div>
    </div>
  )
}
