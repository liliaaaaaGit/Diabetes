"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { InputComposer } from "@/components/buddy/input-composer"
import { ChatContainer } from "@/components/buddy/chat-container"
import { ConversationList } from "@/components/buddy/conversation-list"
import { ConversationSummaryView } from "@/components/buddy/conversation-summary-view"
import { SuggestionChips } from "@/components/buddy/suggestion-chips"
import { DailyImpulseCard } from "@/components/buddy/daily-impulse-card"
import { DailyGoals, type BuddyDailyGoal } from "@/components/buddy/daily-goals"
import { MotivationQuote } from "@/components/buddy/motivation-quote"
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
import { Sparkles, ArrowLeft, MessageCirclePlus } from "lucide-react"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"
import { BuddyStats } from "@/components/buddy/buddy-stats"

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
  const [impulseText, setImpulseText] = useState("Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen.")
  const [motivationQuote, setMotivationQuote] = useState("Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht.")
  const [dailyGoals, setDailyGoals] = useState<BuddyDailyGoal[]>([])
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [refreshingQuote, setRefreshingQuote] = useState(false)
  const [overviewRefreshNonce, setOverviewRefreshNonce] = useState(0)
  const [showEndPrompt, setShowEndPrompt] = useState(false)
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 11) return t("buddy.goodMorning")
    if (hour < 18) return t("buddy.goodAfternoon")
    return t("buddy.goodEvening")
  }

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

  const {
    messages,
    sendMessage,
    isStreaming,
    error: chatError,
    canSend,
    retry,
    suggestionChips,
    clearSuggestionChips,
    conversationTitle,
    hasCrisisFlag,
  } = useChat(viewConversationId, userId)

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const cacheKey = useCallback(
    (name: string) => `buddy_${userId ?? "none"}_${name}_${todayKey}`,
    [userId, todayKey]
  )
  const invalidateOverviewCache = useCallback(() => {
    localStorage.removeItem(cacheKey("impulse"))
    localStorage.removeItem(cacheKey("goals"))
    localStorage.removeItem(cacheKey("motivation"))
  }, [cacheKey])

  useEffect(() => {
    if (!userId) {
      setOverviewLoading(false)
      return
    }
    const loadOverview = async () => {
      setOverviewLoading(true)
      try {
        const loadImpulse = async () => {
          const cached = localStorage.getItem(cacheKey("impulse"))
          if (cached) return cached
          const res = await fetch("/api/buddy/impulse", { credentials: "include" })
          if (!res.ok) return "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          const json = (await res.json()) as { impulse?: string }
          const value = json.impulse || "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          localStorage.setItem(cacheKey("impulse"), value)
          return value
        }

        const loadMotivation = async () => {
          const cached = localStorage.getItem(cacheKey("motivation"))
          if (cached) return cached
          const res = await fetch("/api/buddy/motivation", { credentials: "include" })
          if (!res.ok) return "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
          const json = (await res.json()) as { quote?: string }
          const value = json.quote || "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
          localStorage.setItem(cacheKey("motivation"), value)
          return value
        }

        const loadGoals = async () => {
          const cached = localStorage.getItem(cacheKey("goals"))
          if (cached) {
            try {
              return JSON.parse(cached) as BuddyDailyGoal[]
            } catch {
              // ignore cache parse errors
            }
          }
          const res = await fetch("/api/buddy/goals", { credentials: "include" })
          if (!res.ok) {
            return [
              { id: "f-1", text: "Nenne heute einen kleinen Erfolg.", completed: false },
              { id: "f-2", text: "Atme 3 Mal bewusst tief ein.", completed: false },
              { id: "f-3", text: "Schreib auf, was dir gut tat.", completed: false },
            ] satisfies BuddyDailyGoal[]
          }
          const json = (await res.json()) as { goals?: BuddyDailyGoal[] }
          const value = (json.goals || []).slice(0, 3)
          localStorage.setItem(cacheKey("goals"), JSON.stringify(value))
          return value
        }

        const [impulse, quote, goals] = await Promise.all([loadImpulse(), loadMotivation(), loadGoals()])
        setImpulseText(impulse)
        setMotivationQuote(quote)
        setDailyGoals(goals)
      } finally {
        setOverviewLoading(false)
      }
    }

    void loadOverview()
  }, [cacheKey, todayKey, overviewRefreshNonce, userId])

  useEffect(() => {
    if (!pendingStarterMessage) return
    if (!activeConversationId) return
    if (!canSend) return
    const text = pendingStarterMessage
    setPendingStarterMessage(null)
    handleSendWithExtraction(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStarterMessage, activeConversationId, canSend])

  // Resume only real active conversations (with messages), but do not create on page load.
  useEffect(() => {
    if (conversationsLoading) return
    if (activeConversationId) return

    const active = conversations.find((c) => c.isActive && (c.messageCount || 0) > 0)
    if (active) {
      setActiveConversationId(active.id)
      setViewConversationId(active.id)
      if (activeTab === "chat") setIsFullChatView(true)
    }
  }, [conversations, conversationsLoading, activeConversationId, activeTab])

  const endAndCreateNewActive = async () => {
    const endingId = activeConversationIdRef.current
    if (!endingId) return
    if (endingRef.current) return

    endingRef.current = true
    try {
      console.log("[buddy/end] Starting end flow for conversation:", endingId)
      setBuddyExtraction(null)
      setBuddyAiMessage("")

      const uid = userId
      if (!uid) return

      await endConversation(endingId, uid)
      console.log("[buddy/end] Conversation marked as ended")

      let title = ""
      let summary = ""
      let tags: ConversationTag[] = []
      let dateIso = new Date().toISOString()
      let messages: Message[] = []

      try {
        const full = await getConversation(endingId, uid)
        messages = full.messages
        dateIso = full.endedAt || full.startedAt || dateIso
        title = (full.title || "").trim()

        if (full.messages.length > 0) {
          try {
            const r = await summarizeConversation(full.messages)
            title = (r.title || "").trim() || title
            summary = r.summary
            tags = r.tags
            await updateConversationSummary(endingId, uid, r.summary, r.tags, r.moodEmoji, r.title, r.emotions)
            console.log("[buddy/end] Summary saved")
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
        messages,
      })

      setActiveConversationId(undefined)
      setViewConversationId(undefined)
      setIsFullChatView(false)
      invalidateOverviewCache()
      setOverviewRefreshNonce((v) => v + 1)
      setShowEndPrompt(false)
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
    } finally {
      // no-op
    }
  }

  const handleSendWithExtraction = (text: string) => {
    // Always hide previous suggestions before extracting new ones.
    setBuddyExtraction(null)
    setBuddyAiMessage("")
    clearSuggestionChips()
    const conversationId = activeConversationIdRef.current
    if (!conversationId) {
      void (async () => {
        try {
          if (!userId) return
          const created = await createConversation(userId)
          setActiveConversationId(created.id)
          setViewConversationId(created.id)
          await refetchConversations()
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

  const handleSuggestionSelect = (text: string) => {
    if (!canSend) return
    clearSuggestionChips()
    setShowEndPrompt(false)
    setIsFullChatView(true)
    handleSendWithExtraction(text)
  }

  const openAiMissing = chatError.type === "openai_missing"
  const connectFailed = chatError.type === "failed"

  const handleStartConversation = () => {
    setShowEndPrompt(false)
    setIsFullChatView(true)
    setActiveTab("chat")
  }

  const handleBackToBuddy = () => {
    if (messages.length === 0) {
      setIsFullChatView(false)
      return
    }
    setShowEndPrompt(true)
  }

  const handleConfirmEndConversation = async () => {
    if (isEndingConversation) return
    setIsEndingConversation(true)
    try {
      await endAndCreateNewActive()
    } finally {
      setIsEndingConversation(false)
    }
  }

  const activeConversationWithMessages = conversations.find((c) => c.isActive && (c.messageCount || 0) > 0)

  useEffect(() => {
    if (activeTab !== "history") return
    if (conversations.length === 0) return
    void (async () => {
      try {
        if (!userId) return
        const removed = await cleanupEmptyConversations(userId)
        if (removed > 0) {
          console.log("[buddy/history] Removed empty conversations:", removed)
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
          // keep silent backfill behavior
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

  const handleToggleGoal = async (goal: BuddyDailyGoal) => {
    const updated = dailyGoals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g))
    setDailyGoals(updated)
    localStorage.setItem(cacheKey("goals"), JSON.stringify(updated))
    if (goal.id.startsWith("fallback")) return
    try {
      await fetch("/api/buddy/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ goalId: goal.id, completed: !goal.completed }),
      })
    } catch {
      // keep optimistic state silently
    }
  }

  const handleRefreshMotivation = async () => {
    setRefreshingQuote(true)
    try {
      localStorage.removeItem(cacheKey("motivation"))
      const res = await fetch("/api/buddy/motivation", { credentials: "include" })
      if (!res.ok) return
      const json = (await res.json()) as { quote?: string }
      const quote = json.quote || "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."
      setMotivationQuote(quote)
      localStorage.setItem(cacheKey("motivation"), quote)
    } finally {
      setRefreshingQuote(false)
    }
  }

  return (
    <AppShell title={t("buddy.title")}>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {conversationsError && (
          <p className="text-sm text-red-600">{t("buddy.historyLoadFailed")}</p>
        )}

        {openAiMissing && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("buddy.openAiNotConfigured")}</p>
              <p className="text-xs text-slate-600 mt-1">{t("buddy.openAiNotConfiguredHint")}</p>
            </div>
          </div>
        )}

        {connectFailed && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-900">{t("buddy.connectionProblem")}</p>
              <p className="text-xs text-slate-600 mt-1">{t("buddy.conversationKept")}</p>
            </div>
            <Button onClick={() => retry()} disabled={isStreaming}>
              {t("buddy.retry")}
            </Button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === "chat" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("pages.buddy")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("buddy.history.tab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === "stats" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            {t("buddy.stats.tab")}
          </button>
        </div>

        {activeTab === "chat" && !isFullChatView && (
          <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6">
            {overviewLoading ? (
              <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
            ) : (
              <DailyImpulseCard impulseText={impulseText} greeting={getGreeting()} onStartChat={handleStartConversation} />
            )}

            {overviewLoading ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
              </div>
            ) : (
              <DailyGoals goals={dailyGoals} onToggle={handleToggleGoal} />
            )}

            {overviewLoading ? (
              <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
            ) : (
              <MotivationQuote quote={motivationQuote} onRefresh={handleRefreshMotivation} loading={refreshingQuote} />
            )}

            {activeConversationWithMessages && (
              <section className="rounded-xl border border-teal-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">{t("buddy.activeConversation")}</p>
                <Button
                  type="button"
                  onClick={() => {
                    setViewConversationId(activeConversationWithMessages.id)
                    setActiveConversationId(activeConversationWithMessages.id)
                    setIsFullChatView(true)
                  }}
                  className="mt-3 bg-teal-500 hover:bg-teal-600"
                >
                  {t("buddy.resume")}
                </Button>
              </section>
            )}

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{t("buddy.newConversation")}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t("buddy.intro")}</p>
              <div className="mt-4">
                <SuggestionChips onSelect={handleSuggestionSelect} />
              </div>
              <Button onClick={handleStartConversation} className="mt-3 bg-teal-500 hover:bg-teal-600">
                <MessageCirclePlus className="mr-2 h-4 w-4" />
                {t("buddy.startConversation")}
              </Button>
            </section>
          </div>
        )}

        {activeTab === "chat" && isFullChatView && (
          <div className="flex h-[calc(100vh-10rem)] flex-col">
            <div className="mx-auto w-full max-w-3xl px-4 pb-2">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={handleBackToBuddy} className="rounded-full text-slate-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("buddy.backToBuddy")}
                </Button>
                {conversationTitle && <p className="line-clamp-1 text-sm font-semibold text-slate-700">{conversationTitle}</p>}
              </div>
              {showEndPrompt && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-800">{t("buddy.endConversation")}</p>
                  <div className="mt-2 flex gap-2">
                    <Button type="button" onClick={handleConfirmEndConversation} disabled={isEndingConversation} className="bg-teal-500 hover:bg-teal-600">
                      {t("buddy.endConfirm")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowEndPrompt(false)}>
                      {t("buddy.continueChat")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
              <ChatContainer
                messages={messages}
                onSuggestionSelect={handleSuggestionSelect}
                showTyping={isStreaming}
                contextualSuggestions={suggestionChips}
                showCrisisBanner={hasCrisisFlag}
              />
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
              <InputComposer
                onSend={handleSendWithExtraction}
                isDisabled={!canSend || isStreaming}
                onTypingChange={(typing) => {
                  if (typing) clearSuggestionChips()
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <BuddyStats userId={userId} refreshKey={historyRefreshKey} />
        )}

        {activeTab === "history" && (
          <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
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
                handleStartConversation()
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
                  handleStartConversation()
                  const prefill = c.summary
                    ? `Ich moechte an folgendes Thema anknuepfen: ${c.summary}`
                    : `Ich moechte unser Gespraech "${c.title || "Thema"}" fortsetzen.`
                  setPendingStarterMessage(prefill)
                }
              : undefined
          }
        />
      )}
    </AppShell>
  )
}
