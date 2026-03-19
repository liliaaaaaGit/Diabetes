"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputComposer } from "@/components/buddy/input-composer"
import { ChatContainer } from "@/components/buddy/chat-container"
import { ConversationList } from "@/components/buddy/conversation-list"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "@/hooks/useChat"
import { useConversations } from "@/hooks/useConversations"
import { createConversation, endConversation, updateConversationSummary, createEntry } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import type { Conversation, ExtractedEntry, Message, NewEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
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
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined)
  const [viewConversationId, setViewConversationId] = useState<string | undefined>(undefined)
  const [buddyExtraction, setBuddyExtraction] = useState<ExtractedEntry[] | null>(null)
  const [buddyAiMessage, setBuddyAiMessage] = useState<string>("")

  const activeConversationIdRef = useRef<string | undefined>(undefined)
  const activeMessagesRef = useRef<Message[]>([])
  const endingRef = useRef(false)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(DEFAULT_USER_ID)

  const { messages, sendMessage, isStreaming, error: chatError, canSend, retry } = useChat(viewConversationId)

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
            <TabsTrigger value="chat">{t("buddy.chat")}</TabsTrigger>
            <TabsTrigger value="history">{t("buddy.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full">
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
