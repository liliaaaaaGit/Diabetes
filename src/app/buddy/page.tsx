"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { InputComposer } from "@/components/buddy/input-composer"
import { ChatContainer } from "@/components/buddy/chat-container"
import { ConversationList } from "@/components/buddy/conversation-list"
import { ConversationSummaryView } from "@/components/buddy/conversation-summary-view"
import { BuddyHomeHero } from "@/components/buddy/buddy-home-hero"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "@/hooks/useChat"
import { useConversations } from "@/hooks/useConversations"
import { useUser } from "@/hooks/useUser"
import {
  createConversation,
  endConversation,
  updateConversationSummary,
  createEntry,
  getConversation,
  cleanupEmptyConversations,
} from "@/lib/db"
import type { Conversation, ConversationEmotions, ConversationTag, ExtractedEntry, Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft } from "lucide-react"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"
import { BuddyStats } from "@/components/buddy/buddy-stats"

const FALLBACK_PERSONAL_QUOTE_DE =
  "Du bist nicht allein mit dem, was Diabetes emotional mit sich bringt. Ein kleiner, ehrlicher Schritt zählt."

async function summarizeConversation(messages: Message[]) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    throw new Error("summarize_failed")
  }

  return (await res.json()) as {
    title?: string
    summary: string
    tags: ConversationTag[]
    moodEmoji: string
    emotions: ConversationEmotions
  }
}

type SummaryPortalState =
  | null
  | {
      kind: "post-end"
      title: string
      summary: string
      tags: ConversationTag[]
      dateIso: string
      messages: Message[]
    }
  | { kind: "history"; conversation: Conversation }

export default function BuddyPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()

  const [activeTab, setActiveTab] = useState<"chat" | "history" | "stats">("chat")
  const [isFullChatView, setIsFullChatView] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined)
  const [viewConversationId, setViewConversationId] = useState<string | undefined>(undefined)
  const [buddyExtraction, setBuddyExtraction] = useState<ExtractedEntry[] | null>(null)
  const [buddyAiMessage, setBuddyAiMessage] = useState<string>("")
  const [buddyPersonalQuote, setBuddyPersonalQuote] = useState(FALLBACK_PERSONAL_QUOTE_DE)
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [statsDailyNonce, setStatsDailyNonce] = useState(0)
  const [openingAfterCreateId, setOpeningAfterCreateId] = useState<string | null>(null)
  const [isEndingConversation, setIsEndingConversation] = useState(false)
  const [summaryPortal, setSummaryPortal] = useState<SummaryPortalState>(null)
  const [backfillingIds, setBackfillingIds] = useState<Set<string>>(new Set())
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [pendingStarterMessage, setPendingStarterMessage] = useState<string | null>(null)

  const activeConversationIdRef = useRef<string | undefined>(undefined)
  const endingRef = useRef(false)
  const backfilledRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const cacheKey = useCallback(
    (name: string) => `buddy_${userId ?? "none"}_${name}_${todayKey}`,
    [userId, todayKey]
  )

  const invalidateDailyBuddyCache = useCallback(() => {
    localStorage.removeItem(cacheKey("impulse"))
    localStorage.removeItem(cacheKey("goals"))
    localStorage.removeItem(cacheKey("motivation"))
    setStatsDailyNonce((n) => n + 1)
  }, [cacheKey])

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(userId)

  const refreshBuddyListsAndStats = useCallback(async () => {
    await refetchConversations()
    setHistoryRefreshKey((k) => k + 1)
  }, [refetchConversations])

  const chatConversationId = isFullChatView ? viewConversationId : undefined

  const handleOpeningConsumed = useCallback(() => {
    setOpeningAfterCreateId(null)
  }, [])

  const {
    messages,
    sendMessage,
    isStreaming,
    error: chatError,
    canSend,
    retry,
    conversationTitle,
    hasCrisisFlag,
  } = useChat(chatConversationId, userId, {
    openingRequestId: openingAfterCreateId,
    onOpeningConsumed: handleOpeningConsumed,
  })

  useEffect(() => {
    if (!userId) {
      setQuoteLoading(false)
      return
    }

    let cancelled = false
    setQuoteLoading(true)
    void (async () => {
      try {
        const res = await fetch("/api/buddy/quote", { credentials: "include" })
        if (!res.ok) {
          if (!cancelled) setBuddyPersonalQuote(FALLBACK_PERSONAL_QUOTE_DE)
          return
        }
        const json = (await res.json()) as { quote?: string }
        if (!cancelled) setBuddyPersonalQuote((json.quote || "").trim() || FALLBACK_PERSONAL_QUOTE_DE)
      } catch {
        if (!cancelled) setBuddyPersonalQuote(FALLBACK_PERSONAL_QUOTE_DE)
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const endAndCreateNewActive = async () => {
    const endingId = activeConversationIdRef.current
    if (!endingId) return
    if (endingRef.current) return

    endingRef.current = true
    try {
      setBuddyExtraction(null)
      setBuddyAiMessage("")

      const uid = userId
      if (!uid) return

      await endConversation(endingId, uid)

      let title = ""
      let summary = ""
      let tags: ConversationTag[] = []
      let dateIso = new Date().toISOString()
      let messagesSnapshot: Message[] = []

      try {
        const full = await getConversation(endingId, uid)
        messagesSnapshot = full.messages
        dateIso = full.endedAt || full.startedAt || dateIso
        title = (full.title || "").trim()

        if (full.messages.length > 0) {
          try {
            const r = await summarizeConversation(full.messages)
            title = (r.title || "").trim() || title
            summary = r.summary
            tags = r.tags
            await updateConversationSummary(endingId, uid, r.summary, r.tags, r.moodEmoji, r.title, r.emotions)
          } catch (error) {
            console.error("[buddy/end] Summarize or save failed:", error)
            summary = t("buddy.summaryView.summaryUnavailable")
            tags = []
          }
        } else {
          summary = t("buddy.summaryView.summaryUnavailable")
        }
      } catch (error) {
        console.error("[buddy/end] Load conversation failed:", error)
        summary = t("buddy.summaryView.summaryUnavailable")
      }

      if (!title) title = t("buddy.chat")

      setSummaryPortal({
        kind: "post-end",
        title,
        summary,
        tags,
        dateIso,
        messages: messagesSnapshot,
      })

      setActiveConversationId(undefined)
      setViewConversationId(undefined)
      activeConversationIdRef.current = undefined
      setIsFullChatView(false)
      invalidateDailyBuddyCache()
      await refreshBuddyListsAndStats()
    } finally {
      endingRef.current = false
    }
  }

  const activeConversationIdNow = activeConversationIdRef.current

  const extractForBuddy = async (userText: string, conversationId: string) => {
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: userText.slice(0, 500) }),
      })
      if (!res.ok) {
        toast({
          title: t("logbook.aiAnalyzeFailed"),
          variant: "destructive",
        })
        return
      }
      const json = (await res.json()) as { entries: ExtractedEntry[]; message?: string }
      const suggested = (json.entries ?? [])
        .filter((e) => typeof e.confidence === "number" && e.confidence >= 0.7)
        .map((e) => ({ ...e, included: true }))

      if (suggested.length === 0) {
        setBuddyExtraction(null)
        setBuddyAiMessage("")
        return
      }

      setBuddyExtraction(suggested)
      setBuddyAiMessage(json.message ?? "")
    } catch {
      toast({
        title: t("logbook.aiAnalyzeFailed"),
        variant: "destructive",
      })
    }
  }

  const handleSendWithExtraction = (text: string) => {
    setBuddyExtraction(null)
    setBuddyAiMessage("")
    const conversationId = activeConversationIdRef.current
    if (!conversationId) {
      void (async () => {
        try {
          if (!userId) return
          const created = await createConversation(userId)
          activeConversationIdRef.current = created.id
          setActiveConversationId(created.id)
          setViewConversationId(created.id)
          setIsFullChatView(true)
          await refetchConversations()
          setOpeningAfterCreateId(created.id)
          setPendingStarterMessage(text)
        } catch (error) {
          console.error("[buddy/chat] Failed to create conversation:", error)
        }
      })()
      return
    }

    void extractForBuddy(text, conversationId)
    void sendMessage(text)
  }

  useEffect(() => {
    if (!pendingStarterMessage) return
    if (!activeConversationId) return
    if (!canSend || isStreaming) return
    if (messages.length === 0) return

    const text = pendingStarterMessage
    setPendingStarterMessage(null)
    handleSendWithExtraction(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStarterMessage, activeConversationId, canSend, isStreaming, messages.length])

  const startNewConversation = async () => {
    if (!userId) return
    try {
      const created = await createConversation(userId)
      activeConversationIdRef.current = created.id
      setActiveConversationId(created.id)
      setViewConversationId(created.id)
      setIsFullChatView(true)
      setActiveTab("chat")
      setOpeningAfterCreateId(created.id)
      await refetchConversations()
    } catch (error) {
      console.error("[buddy] Failed to start new conversation:", error)
    }
  }

  const openAiMissing = chatError.type === "openai_missing"
  const connectFailed = chatError.type === "failed"

  const handleConfirmEndConversation = async () => {
    if (isEndingConversation) return
    setIsEndingConversation(true)
    try {
      await endAndCreateNewActive()
    } finally {
      setIsEndingConversation(false)
    }
  }

  /** Leerer Chat: Buddy-Hauptseite ohne Beenden. Mit Nachrichten: Gespräch beenden inkl. Zusammenfassung. */
  const handleLeaveChat = () => {
    if (messages.length === 0) {
      setIsFullChatView(false)
      setActiveConversationId(undefined)
      setViewConversationId(undefined)
      activeConversationIdRef.current = undefined
      return
    }
    void handleConfirmEndConversation()
  }

  useEffect(() => {
    if (activeTab !== "history") return
    if (conversations.length === 0) return
    void (async () => {
      try {
        if (!userId) return
        const removed = await cleanupEmptyConversations(userId)
        if (removed > 0) {
          await refetchConversations()
        }
      } catch (error) {
        console.error("[buddy/history] Cleanup failed:", error)
      }
    })()

    const targets = conversations.filter(
      (c) =>
        !c.isActive &&
        (c.messageCount || 0) > 0 &&
        (!c.summary || !c.title) &&
        !backfilledRef.current.has(c.id)
    )
    if (targets.length === 0) return

    void (async () => {
      for (const conv of targets) {
        backfilledRef.current.add(conv.id)
        setBackfillingIds((prev) => new Set(prev).add(conv.id))
        try {
          if (!userId) break
          const full = await getConversation(conv.id, userId)
          if (!full.messages || full.messages.length === 0) continue
          const { title, summary, tags, moodEmoji, emotions } = await summarizeConversation(full.messages)
          await updateConversationSummary(conv.id, userId, summary, tags, moodEmoji, title, emotions)
        } catch {
          // silent backfill
        } finally {
          setBackfillingIds((prev) => {
            const next = new Set(prev)
            next.delete(conv.id)
            return next
          })
        }
      }
      await refetchConversations()
      setHistoryRefreshKey((v) => v + 1)
    })()
  }, [activeTab, conversations, refetchConversations, userId])

  return (
    <AppShell title={t("buddy.title")}>
      <div className="relative flex h-[calc(100dvh-8.5rem)] min-h-0 flex-col md:h-[calc(100dvh-9rem)]">
        {conversationsError && (
          <p className="shrink-0 text-sm text-red-600">{t("buddy.historyLoadFailed")}</p>
        )}

        {openAiMissing && (
          <div className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("buddy.openAiNotConfigured")}</p>
              <p className="text-xs text-slate-600 mt-1">{t("buddy.openAiNotConfiguredHint")}</p>
            </div>
          </div>
        )}

        {connectFailed && (
          <div className="mb-3 shrink-0 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-900">{t("buddy.connectionProblem")}</p>
              <p className="text-xs text-slate-600 mt-1">{t("buddy.conversationKept")}</p>
            </div>
            <Button onClick={() => retry()} disabled={isStreaming}>
              {t("buddy.retry")}
            </Button>
          </div>
        )}

        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 sm:mb-2 sm:gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm ${activeTab === "chat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("pages.buddy")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm ${activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("buddy.history.tab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm ${activeTab === "stats" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("buddy.stats.tab")}
          </button>
        </div>

        {activeTab === "chat" && !isFullChatView && (
          <div className="mx-auto mt-8 flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-2 pb-2 md:mt-10 md:px-4 md:pb-3 lg:mt-12 lg:px-6">
            <BuddyHomeHero
              quote={buddyPersonalQuote}
              quoteLoading={quoteLoading}
              newChatLabel={t("buddy.newConversation")}
              disclaimer={t("buddy.intro")}
              robotImageAlt={t("buddy.robotAlt")}
              onNewConversation={() => void startNewConversation()}
              disabled={conversationsLoading || !userId}
            />
          </div>
        )}

        {activeTab === "chat" && isFullChatView && (
          <div className="flex h-[calc(100vh-10rem)] min-h-0 flex-col">
            <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pb-2 md:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleLeaveChat()}
                  disabled={isEndingConversation}
                  className="rounded-full text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("buddy.chatLeaveEndConversation")}
                </Button>
                {conversationTitle && (
                  <p className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-slate-700 md:text-base">
                    {conversationTitle}
                  </p>
                )}
              </div>
            </div>
            <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-0 md:px-6 lg:px-8">
              <ChatContainer messages={messages} showTyping={isStreaming} showCrisisBanner={hasCrisisFlag} />
              {buddyExtraction &&
                viewConversationId === activeConversationIdRef.current &&
                activeConversationIdNow && (
                  <ExtractionConfirmation
                    extractedEntries={buddyExtraction}
                    aiMessage={buddyAiMessage}
                    title={t("buddy.suggestedEntries")}
                    source="conversation"
                    onSaveEntry={async (entry) => {
                      if (!userId) throw new Error("Not signed in")
                      await createEntry(userId, entry)
                    }}
                    onSaveResult={({ saved, failed }) => {
                      if (failed === 0 && saved > 0) {
                        setBuddyExtraction(null)
                        setBuddyAiMessage("")
                      }
                    }}
                    onDiscard={() => {
                      setBuddyExtraction(null)
                      setBuddyAiMessage("")
                    }}
                    conversationId={activeConversationIdNow}
                  />
                )}
              <InputComposer onSend={handleSendWithExtraction} isDisabled={!canSend || isStreaming} />
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <BuddyStats
            userId={userId}
            refreshKey={historyRefreshKey}
            dailyRefreshNonce={statsDailyNonce}
          />
        )}

        {activeTab === "history" && (
          <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:px-8">
            <ConversationList
              userId={userId}
              conversations={conversations}
              onSelect={async (conversation) => {
                if (!userId) return
                const full = await getConversation(conversation.id, userId)
                setSummaryPortal({ kind: "history", conversation: full })
              }}
              onStartFirstConversation={() => {
                setActiveTab("chat")
                void startNewConversation()
              }}
              backfillingIds={backfillingIds}
              statsRefreshKey={historyRefreshKey}
              onConversationUpdated={refreshBuddyListsAndStats}
            />
          </div>
        )}

      </div>

      {summaryPortal && (
        <ConversationSummaryView
          title={
            summaryPortal.kind === "history"
              ? summaryPortal.conversation.title?.trim() || t("buddy.chat")
              : summaryPortal.title
          }
          summary={
            summaryPortal.kind === "history"
              ? summaryPortal.conversation.summary?.trim() || t("buddy.summaryView.summaryUnavailable")
              : summaryPortal.summary
          }
          tags={summaryPortal.kind === "history" ? summaryPortal.conversation.tags : summaryPortal.tags}
          dateIso={
            summaryPortal.kind === "history"
              ? summaryPortal.conversation.endedAt || summaryPortal.conversation.startedAt
              : summaryPortal.dateIso
          }
          messages={summaryPortal.kind === "history" ? summaryPortal.conversation.messages : summaryPortal.messages}
          onBack={() => setSummaryPortal(null)}
          onStartNewChat={
            summaryPortal.kind === "history"
              ? () => {
                  const c = summaryPortal.conversation
                  setSummaryPortal(null)
                  setActiveTab("chat")
                  void (async () => {
                    if (!userId) return
                    try {
                      const created = await createConversation(userId)
                      activeConversationIdRef.current = created.id
                      setActiveConversationId(created.id)
                      setViewConversationId(created.id)
                      setIsFullChatView(true)
                      await refetchConversations()
                      setOpeningAfterCreateId(created.id)
                    } catch (e) {
                      console.error("[buddy] New chat from history failed:", e)
                    }
                  })()
                }
              : undefined
          }
        />
      )}
    </AppShell>
  )
}
