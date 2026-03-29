"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Message } from "@/lib/types"
import { getConversation, addMessage, updateConversationTitle } from "@/lib/db"
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

const CRISIS_KEYWORDS = [
  "umbringen",
  "suizid",
  "selbstmord",
  "nicht mehr leben",
  "aufhören zu leben",
  "alles beenden",
  "keinen sinn",
  "wehtun",
  "selbst verletzen",
  "ritzen",
  "will nicht mehr",
  "kann nicht mehr",
  "verschwinden",
  "tot sein",
]

function normalizeCrisisText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

export function detectCrisisKeywords(text: string): boolean {
  const normalized = normalizeCrisisText(text)
  return CRISIS_KEYWORDS.some((keyword) => normalized.includes(normalizeCrisisText(keyword)))
}

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

function parseAssistantPayload(raw: string): { text: string; chips: string[] } {
  const chipMatch = raw.match(/<!--chips:\s*(\[[\s\S]*?\])\s*-->/)
  if (!chipMatch) return { text: raw, chips: [] }

  let chips: string[] = []
  try {
    const parsed = JSON.parse(chipMatch[1])
    if (Array.isArray(parsed)) {
      chips = parsed.map((c) => String(c).trim()).filter(Boolean).slice(0, 3)
    }
  } catch {
    chips = []
  }

  const text = raw.replace(chipMatch[0], "").trim()
  return { text, chips }
}

export function useChat(conversationId: string | undefined, userId: string | null) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<ChatError>({ type: "none" })
  const [suggestionChips, setSuggestionChips] = useState<string[]>([])
  const [conversationTitle, setConversationTitle] = useState<string>("")

  const messagesRef = useRef<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const [conversationIsActive, setConversationIsActive] = useState<boolean>(true)
  const [hasCrisisFlag, setHasCrisisFlag] = useState(false)

  const canSend = useMemo(() => conversationIsActive, [conversationIsActive])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!conversationId || !userId) return

    let cancelled = false
    ;(async () => {
      try {
        const conv = await getConversation(conversationId, userId)
        if (cancelled) return
        setMessages(conv.messages || [])
        setConversationIsActive(conv.isActive)
        setConversationTitle(conv.title || "")
        const crisisInHistory = (conv.messages || []).some(
          (m) => m.role === "user" && detectCrisisKeywords(m.content || "")
        )
        setHasCrisisFlag(crisisInHistory)
      } catch {
        if (cancelled) return
        setMessages([])
        setHasCrisisFlag(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [conversationId, userId])

  const resetRateWindowIfNeeded = () => {
    const now = Date.now()
    const windowStart = now - WINDOW_MS
    const arr = readRateWindow().filter((t) => t >= windowStart)
    writeRateWindow(arr)
    return arr
  }

  const streamAssistantResponse = useCallback(
    async (requestMessages: Array<{ role: Message["role"]; content: string }>) => {
      if (!conversationId || !userId) return
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
          credentials: "include",
          body: JSON.stringify({
            messages: requestMessages,
            conversationId: conversationId ?? "",
          }),
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

        let rawText = ""
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          if (!chunk) continue
          rawText += chunk
          const parsed = parseAssistantPayload(rawText)
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: parsed.text } : m))
          )
          setSuggestionChips(parsed.chips)
        }

        const parsedFinal = parseAssistantPayload(rawText)
        if (parsedFinal.text.trim()) {
          await addMessage(conversationId, "assistant", parsedFinal.text, userId)
          setSuggestionChips(parsedFinal.chips)
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
    [conversationId, userId, t, toast]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !userId) return
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
      setSuggestionChips([])

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        conversationId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      }

      // Optimistic UI: show user immediately, then stream assistant.
      setMessages((prev) => [...prev, userMessage])
      if (detectCrisisKeywords(text)) {
        setHasCrisisFlag(true)
      }
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        // Persist user message in DB
        await addMessage(conversationId, "user", text, userId)

        const userMessagesCount =
          messagesRef.current.filter((m) => m.role === "user").length + 1
        if (userMessagesCount === 1) {
          void (async () => {
            try {
              const res = await fetch("/api/buddy/title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ conversationId, firstMessage: text }),
              })
              if (!res.ok) {
                const fallback = `${text.slice(0, 40).trim()}...`
                setConversationTitle(fallback)
                await updateConversationTitle(conversationId, fallback, userId)
                return
              }
              const json = (await res.json()) as { title?: string }
              if (json.title) {
                setConversationTitle(json.title)
              }
            } catch {
              const fallback = `${text.slice(0, 40).trim()}...`
              setConversationTitle(fallback)
              void updateConversationTitle(conversationId, fallback, userId)
            }
          })()
        }

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
    [canSend, conversationId, userId, streamAssistantResponse, t, toast]
  )

  const retry = useCallback(() => {
    if (!conversationId || !userId) return
    if (!canSend) return

    const requestMessages: Array<{ role: Message["role"]; content: string }> = [
      ...messagesRef.current
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content })),
    ]

    void streamAssistantResponse(requestMessages)
  }, [canSend, conversationId, userId, streamAssistantResponse])

  const clearSuggestionChips = useCallback(() => {
    setSuggestionChips([])
  }, [])

  return {
    messages,
    sendMessage,
    isStreaming,
    error,
    canSend,
    retry,
    suggestionChips,
    clearSuggestionChips,
    conversationTitle,
    hasCrisisFlag,
  }
}

