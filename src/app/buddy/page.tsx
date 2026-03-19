"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputComposer } from "@/components/buddy/input-composer"
import { ChatContainer } from "@/components/buddy/chat-container"
import { ConversationList } from "@/components/buddy/conversation-list"
import { SuggestionChips } from "@/components/buddy/suggestion-chips"
import { DailyImpulseCard } from "@/components/buddy/daily-impulse-card"
import { DailyGoals, type BuddyDailyGoal } from "@/components/buddy/daily-goals"
import { MotivationQuote } from "@/components/buddy/motivation-quote"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "@/hooks/useChat"
import { useConversations } from "@/hooks/useConversations"
import { createConversation, endConversation, updateConversationSummary, createEntry } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import type { Conversation, ExtractedEntry, Message, NewEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft, MessageCirclePlus } from "lucide-react"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"

async function summarizeConversation(messages: Message[]) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    throw new Error("summarize_failed")
  }

  return (await res.json()) as {
    summary: string
    tags: string[]
    moodEmoji: string
  }
}

export default function BuddyPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat")
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

  const activeConversationIdRef = useRef<string | undefined>(undefined)
  const activeMessagesRef = useRef<Message[]>([])
  const endingRef = useRef(false)

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
  } = useConversations(DEFAULT_USER_ID)

  const { messages, sendMessage, isStreaming, error: chatError, canSend, retry } = useChat(viewConversationId)

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const cacheKey = (name: string) => `buddy_${name}_${todayKey}`

  useEffect(() => {
    const loadOverview = async () => {
      setOverviewLoading(true)
      try {
        const loadImpulse = async () => {
          const cached = localStorage.getItem(cacheKey("impulse"))
          if (cached) return cached
          const res = await fetch("/api/buddy/impulse")
          if (!res.ok) return "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          const json = (await res.json()) as { impulse?: string }
          const value = json.impulse || "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."
          localStorage.setItem(cacheKey("impulse"), value)
          return value
        }

        const loadMotivation = async () => {
          const cached = localStorage.getItem(cacheKey("motivation"))
          if (cached) return cached
          const res = await fetch("/api/buddy/motivation")
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
          const res = await fetch("/api/buddy/goals")
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
  }, [todayKey])

  useEffect(() => {
    if (!viewConversationId) return
    if (viewConversationId === activeConversationIdRef.current) {
      activeMessagesRef.current = messages
    }
  }, [messages, viewConversationId])

  // Pick/create an active conversation on first load.
  useEffect(() => {
    if (conversationsLoading) return
    if (activeConversationId) return

    const active = conversations.find((c) => c.isActive)
    if (active) {
      setActiveConversationId(active.id)
      setViewConversationId(active.id)
      return
    }

    void (async () => {
      try {
        const created = await createConversation(DEFAULT_USER_ID)
        await refetchConversations()
        setActiveConversationId(created.id)
        setViewConversationId(created.id)
      } catch {
        // Keep UI stable
      }
    })()
  }, [conversations, conversationsLoading, activeConversationId, refetchConversations])

  const endAndCreateNewActive = async () => {
    const endingId = activeConversationIdRef.current
    if (!endingId) return
    if (endingRef.current) return

    endingRef.current = true
    try {
      setBuddyExtraction(null)
      setBuddyAiMessage("")
      const currentMessages = activeMessagesRef.current

      // 1) Create summary + persist it (best effort)
      if (currentMessages.length > 0) {
        try {
          const { summary, tags, moodEmoji } = await summarizeConversation(currentMessages)
          await updateConversationSummary(endingId, summary, tags, moodEmoji)
        } catch {
          // Don't block ending if summary fails.
        }
      }

      // 2) End conversation
      await endConversation(endingId)

      // 3) Create a new active conversation for next visit
      const created = await createConversation(DEFAULT_USER_ID)
      setActiveConversationId(created.id)
      await refetchConversations()
    } finally {
      endingRef.current = false
    }
  }

  // When user switches away from the active conversation (history card click), end the active one.
  useEffect(() => {
    if (!viewConversationId) return
    if (!activeConversationId) return
    if (viewConversationId === activeConversationId) return

    void endAndCreateNewActive()
  }, [viewConversationId, activeConversationId])

  // On unmount: end active conversation.
  useEffect(() => {
    return () => {
      void endAndCreateNewActive()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeConversationIdNow = activeConversationIdRef.current

  const extractForBuddy = async (userText: string, conversationId: string) => {
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const conversationId = activeConversationIdRef.current
    if (!conversationId) return

    void extractForBuddy(text, conversationId)
    void sendMessage(text)
  }

  const handleSuggestionSelect = (text: string) => {
    if (!canSend) return
    setIsFullChatView(true)
    handleSendWithExtraction(text)
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setViewConversationId(conversation.id)
    setActiveTab("chat")
    setBuddyExtraction(null)
    setBuddyAiMessage("")
  }

  const handleSaveBuddyExtraction = async (newEntries: NewEntry[]) => {
    if (newEntries.length === 0) return
    try {
      for (const e of newEntries) {
        // eslint-disable-next-line no-await-in-loop
        await createEntry(e)
      }
      toast({
        title: t("logbook.aiSaveSuccess", { count: newEntries.length }),
      })
      setBuddyExtraction(null)
      setBuddyAiMessage("")
    } catch {
      toast({
        title: t("logbook.aiSaveFailed"),
        variant: "destructive",
      })
    }
  }

  const openAiMissing = chatError.type === "openai_missing"
  const connectFailed = chatError.type === "failed"

  const handleStartConversation = () => {
    setIsFullChatView(true)
    setActiveTab("chat")
  }

  const handleToggleGoal = async (goal: BuddyDailyGoal) => {
    const updated = dailyGoals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g))
    setDailyGoals(updated)
    localStorage.setItem(cacheKey("goals"), JSON.stringify(updated))
    if (goal.id.startsWith("fallback")) return
    try {
      await fetch("/api/buddy/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch("/api/buddy/motivation")
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "history")} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="chat">{t("pages.buddy")}</TabsTrigger>
            <TabsTrigger value="history">{t("buddy.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
            {!isFullChatView ? (
              <div className="h-full overflow-y-auto">
                <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
                  {overviewLoading ? (
                    <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
                  ) : (
                    <DailyImpulseCard
                      impulseText={impulseText}
                      greeting={getGreeting()}
                      onStartChat={handleStartConversation}
                    />
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
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full">
                <div className="px-4 pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFullChatView(false)}
                    className="rounded-full text-slate-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("buddy.backToBuddy")}
                  </Button>
                </div>
                <ChatContainer messages={messages} onSuggestionSelect={handleSuggestionSelect} showTyping={isStreaming} />
                {buddyExtraction &&
                  viewConversationId === activeConversationIdRef.current &&
                  activeConversationIdNow && (
                  <ExtractionConfirmation
                    extractedEntries={buddyExtraction}
                    aiMessage={buddyAiMessage}
                    title={t("buddy.suggestedEntries")}
                    onSave={handleSaveBuddyExtraction}
                    onDiscard={() => {
                      setBuddyExtraction(null)
                      setBuddyAiMessage("")
                    }}
                    conversationId={activeConversationIdNow}
                  />
                )}
                <InputComposer onSend={handleSendWithExtraction} isDisabled={!canSend || isStreaming} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <ConversationList conversations={conversations} onSelect={handleConversationSelect} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
