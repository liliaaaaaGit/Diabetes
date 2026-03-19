"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Message } from "@/lib/types"
import { getConversation, addMessage } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

type ChatError =
  | { type: "none" }
  | { type: "openai_missing"; message: string }
  | { type: "rate_limited"; message: string }
  | { type: "failed"; message: string }

const RATE_LIMIT_KEY = "glucoBuddy_rate_timestamps"
const MAX_MESSAGES = 30
const WINDOW_MS = 5 * 60 * 1000

function readRateWindow(): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((x) => Number(x)).filter((n) => Number.isFinite(n))
  } catch {
    return []
  }
}

function writeRateWindow(timestamps: number[]) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps))
}

export function useChat(conversationId?: string) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<ChatError>({ type: "none" })

  const messagesRef = useRef<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const [conversationIsActive, setConversationIsActive] = useState<boolean>(true)

  const canSend = useMemo(() => conversationIsActive, [conversationIsActive])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!conversationId) return

    let cancelled = false
    ;(async () => {
      try {
        const conv = await getConversation(conversationId)
        if (cancelled) return
        setMessages(conv.messages || [])
        setConversationIsActive(conv.isActive)
      } catch {
        if (cancelled) return
        setMessages([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [conversationId])

  const resetRateWindowIfNeeded = () => {
    const now = Date.now()
    const windowStart = now - WINDOW_MS
    const arr = readRateWindow().filter((t) => t >= windowStart)
    writeRateWindow(arr)
    return arr
  }

  const streamAssistantResponse = useCallback(
    async (requestMessages: Array<{ role: Message["role"]; content: string }>) => {
      if (!conversationId) return
      setError({ type: "none" })
      setIsStreaming(true)

      const assistantId = `local-assistant-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantId,
        conversationId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: requestMessages }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let json: any = null
          try {
            json = await res.json()
          } catch {
            // ignore
          }

          const code = json?.code
          if (code === "missing_api_key") {
            const msg = t("buddy.openAiNotConfigured")
            setError({ type: "openai_missing", message: msg })
            setIsStreaming(false)
            setMessages((prev) => prev.filter((m) => m.id !== assistantId))
            return
          }

          toast({
            title: t("buddy.connectionProblem"),
            variant: "destructive",
          })
          setError({ type: "failed", message: t("buddy.connectionProblem") })
          setIsStreaming(false)
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
          return
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")
        const decoder = new TextDecoder()

        let fullText = ""
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          if (!chunk) continue
          fullText += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
          )
        }

        if (fullText.trim()) {
          await addMessage(conversationId, "assistant", fullText)
        }
      } catch {
        toast({
          title: t("buddy.connectionProblem"),
          variant: "destructive",
        })
        setError({ type: "failed", message: t("buddy.connectionProblem") })
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsStreaming(false)
      }
    },
    [addMessage, conversationId, toast]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId) return
      if (!canSend) return

      const now = Date.now()
      const windowStart = now - WINDOW_MS
      const arr = readRateWindow().filter((t) => t >= windowStart)

      if (arr.length >= MAX_MESSAGES) {
        const msg = t("buddy.rateLimited")
        setError({ type: "rate_limited", message: msg })
        toast({ title: msg, variant: "destructive" })
        return
      }

      // Persist rate window immediately to avoid race conditions.
      writeRateWindow([...arr, now])

      setError({ type: "none" })
      setIsStreaming(true)

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        conversationId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      }

      // Optimistic UI: show user immediately, then stream assistant.
      setMessages((prev) => [...prev, userMessage])
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Persist user message in DB
        void addMessage(conversationId, "user", text)

        const requestMessages: Array<{ role: Message["role"]; content: string }> = [
          ...messagesRef.current
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ]

        abortRef.current = controller
        await streamAssistantResponse(requestMessages)
      } catch {
        toast({
          title: t("buddy.connectionProblem"),
          variant: "destructive",
        })
        setError({ type: "failed", message: t("buddy.connectionProblem") })
        setIsStreaming(false)
      }
    },
    [canSend, conversationId, streamAssistantResponse, toast]
  )

  const retry = useCallback(() => {
    if (!conversationId) return
    if (!canSend) return

    const requestMessages: Array<{ role: Message["role"]; content: string }> = [
      ...messagesRef.current
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content })),
    ]

    void streamAssistantResponse(requestMessages)
  }, [canSend, conversationId, streamAssistantResponse])

  return {
    messages,
    sendMessage,
    isStreaming,
    error,
    canSend,
    retry,
  }
}

