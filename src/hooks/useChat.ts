"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Message } from "@/lib/types"
import { getConversation, addMessage, updateConversationTitle } from "@/lib/db"
import { BUDDY_OPENING_USER_MESSAGE } from "@/lib/buddy-chat-constants"
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

function isOpeningRequest(
  requestMessages: Array<{ role: Message["role"]; content: string }>
): boolean {
  return (
    requestMessages.length === 1 &&
    requestMessages[0].role === "user" &&
    requestMessages[0].content === BUDDY_OPENING_USER_MESSAGE
  )
}

export type UseChatOptions = {
  /** When this equals the active conversation id and the thread is empty after load, send the hidden opening turn. */
  openingRequestId?: string | null
  onOpeningConsumed?: () => void
}

export function useChat(
  conversationId: string | undefined,
  userId: string | null,
  options?: UseChatOptions
) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<ChatError>({ type: "none" })
  const [conversationTitle, setConversationTitle] = useState<string>("")

  const openingRequestIdRef = useRef(options?.openingRequestId ?? null)
  openingRequestIdRef.current = options?.openingRequestId ?? null
  const onOpeningConsumedRef = useRef(options?.onOpeningConsumed)
  onOpeningConsumedRef.current = options?.onOpeningConsumed
  /** Verhindert doppeltes Opening bei React Strict Mode (Effect läuft 2×). */
  const openingLatchRef = useRef<string | null>(null)

  const messagesRef = useRef<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const [conversationIsActive, setConversationIsActive] = useState<boolean>(true)
  const [hasCrisisFlag, setHasCrisisFlag] = useState(false)

  const canSend = useMemo(() => conversationIsActive, [conversationIsActive])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const streamAssistantResponse = useCallback(
    async (cid: string, requestMessages: Array<{ role: Message["role"]; content: string }>) => {
      if (!userId) return
      setError({ type: "none" })
      setIsStreaming(true)

      const assistantId = `local-assistant-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantId,
        conversationId: cid,
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
            conversationId: cid,
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
        }

        const parsedFinal = parseAssistantPayload(rawText)
        if (parsedFinal.text.trim()) {
          await addMessage(cid, "assistant", parsedFinal.text, userId)

          if (isOpeningRequest(requestMessages)) {
            void (async () => {
              try {
                const res = await fetch("/api/buddy/title", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    conversationId: cid,
                    firstMessage: parsedFinal.text.slice(0, 500),
                  }),
                })
                if (!res.ok) {
                  const fallback = `${parsedFinal.text.slice(0, 40).trim()}…`
                  setConversationTitle(fallback)
                  await updateConversationTitle(cid, fallback, userId)
                  return
                }
                const json = (await res.json()) as { title?: string }
                if (json.title) {
                  setConversationTitle(json.title)
                }
              } catch {
                const fallback = `${parsedFinal.text.slice(0, 40).trim()}…`
                setConversationTitle(fallback)
                void updateConversationTitle(cid, fallback, userId)
              }
            })()
          }
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
    [userId, t, toast]
  )

  const sendOpeningMessage = useCallback(
    async (cid: string) => {
      await streamAssistantResponse(cid, [{ role: "user", content: BUDDY_OPENING_USER_MESSAGE }])
    },
    [streamAssistantResponse]
  )

  const sendOpeningMessageRef = useRef(sendOpeningMessage)
  sendOpeningMessageRef.current = sendOpeningMessage

  useEffect(() => {
    if (!conversationId || !userId) {
      openingLatchRef.current = null
      setMessages([])
      setConversationIsActive(true)
      setConversationTitle("")
      setHasCrisisFlag(false)
      setError({ type: "none" })
      setIsStreaming(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const conv = await getConversation(conversationId, userId)
        if (cancelled) return
        const list = conv.messages || []
        setMessages(list)
        setConversationIsActive(conv.isActive)
        setConversationTitle(conv.title || "")
        const crisisInHistory = list.some(
          (m) => m.role === "user" && detectCrisisKeywords(m.content || "")
        )
        setHasCrisisFlag(crisisInHistory)

        const wantOpen = openingRequestIdRef.current
        const shouldOpen = wantOpen === conversationId && list.length === 0
        if (shouldOpen) {
          if (openingLatchRef.current === conversationId) return
          openingLatchRef.current = conversationId
          if (cancelled) return
          onOpeningConsumedRef.current?.()
          await sendOpeningMessageRef.current(conversationId)
        }
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

      writeRateWindow([...arr, now])

      setError({ type: "none" })

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        conversationId,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      if (detectCrisisKeywords(text)) {
        setHasCrisisFlag(true)
      }
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
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
                const fallback = `${text.slice(0, 40).trim()}…`
                setConversationTitle(fallback)
                await updateConversationTitle(conversationId, fallback, userId)
                return
              }
              const json = (await res.json()) as { title?: string }
              if (json.title) {
                setConversationTitle(json.title)
              }
            } catch {
              const fallback = `${text.slice(0, 40).trim()}…`
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
        await streamAssistantResponse(conversationId, requestMessages)
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

    void streamAssistantResponse(conversationId, requestMessages)
  }, [canSend, conversationId, userId, streamAssistantResponse])

  return {
    messages,
    sendMessage,
    isStreaming,
    error,
    canSend,
    retry,
    conversationTitle,
    hasCrisisFlag,
    sendOpeningMessage,
  }
}
