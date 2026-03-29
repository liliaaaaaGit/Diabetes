"use client"

import { useEffect, useMemo, useState } from "react"
import type { Conversation, ConversationEmotions, ConversationTag } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getConversation, searchConversations, updateConversationSummary } from "@/lib/db"
import { HistoryStats } from "./history-stats"
import { HistoryConversationCard, HistoryListHeader } from "./history-conversation-card"

interface ConversationListProps {
  userId: string | null
  conversations: Conversation[]
  onSelect: (conversation: Conversation) => void
  onStartFirstConversation: () => void
  backfillingIds?: Set<string>
  statsRefreshKey?: number
  /** Called after a manual summary refresh so the parent can refetch the list */
  onConversationUpdated?: () => void | Promise<void>
}

export function ConversationList({
  userId,
  conversations,
  onSelect,
  onStartFirstConversation,
  backfillingIds = new Set<string>(),
  statsRefreshKey = 0,
  onConversationUpdated,
}: ConversationListProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState<Conversation[]>(conversations)
  const [searching, setSearching] = useState(false)
  const [fallbackTitles, setFallbackTitles] = useState<Record<string, string>>({})
  const [refreshingSummaryId, setRefreshingSummaryId] = useState<string | null>(null)

  useEffect(() => {
    setFiltered(
      conversations.filter((c) => {
        const u = (c as Conversation & { userMessageCount?: number }).userMessageCount
        return u !== undefined ? u > 0 : (c.messageCount ?? c.messages.length ?? 0) > 0
      })
    )
  }, [conversations])

  useEffect(() => {
    const id = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          setFiltered(
            conversations.filter((c) => {
              const u = (c as Conversation & { userMessageCount?: number }).userMessageCount
              return u !== undefined ? u > 0 : (c.messageCount ?? c.messages.length ?? 0) > 0
            })
          )
          return
        }
        if (!userId) {
          setFiltered([])
          return
        }
        setSearching(true)
        try {
          const rows = await searchConversations(userId, query.trim())
          setFiltered(
            rows.filter((c) => {
              const u = (c as Conversation & { userMessageCount?: number }).userMessageCount
              return u !== undefined ? u > 0 : (c.messageCount ?? c.messages.length ?? 0) > 0
            })
          )
        } finally {
          setSearching(false)
        }
      })()
    }, 300)

    return () => clearTimeout(id)
  }, [conversations, query, userId])

  const sortedConversations = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      const aTime = new Date(a.endedAt || a.startedAt).getTime()
      const bTime = new Date(b.endedAt || b.startedAt).getTime()
      return bTime - aTime
    })
    return arr
  }, [filtered])

  useEffect(() => {
    const missing = sortedConversations
      .filter((c) => !c.title)
      .map((c) => c.id)
      .filter((id) => !fallbackTitles[id])
    if (missing.length === 0) return

    void (async () => {
      for (const id of missing) {
        try {
          if (!userId) continue
          const full = await getConversation(id, userId)
          const firstUser = full.messages.find((m) => m.role === "user")?.content?.trim()
          if (!firstUser) continue
          setFallbackTitles((prev) => ({ ...prev, [id]: `${firstUser.slice(0, 40)}...` }))
        } catch {
          // keep silent
        }
      }
    })()
  }, [fallbackTitles, sortedConversations, userId])

  const handleRefreshSummary = async (conversationId: string) => {
    if (!userId) return
    setRefreshingSummaryId(conversationId)
    try {
      const full = await getConversation(conversationId, userId)
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: full.messages }),
      })
      if (!res.ok) throw new Error("summarize_failed")
      const data = (await res.json()) as {
        title?: string
        summary: string
        tags: ConversationTag[]
        moodEmoji: string
        emotions: ConversationEmotions
      }
      await updateConversationSummary(
        conversationId,
        userId,
        data.summary,
        data.tags,
        data.moodEmoji,
        data.title,
        data.emotions
      )
      await onConversationUpdated?.()
    } catch {
      toast({
        title: t("buddy.history.refreshFailed"),
        variant: "destructive",
      })
    } finally {
      setRefreshingSummaryId(null)
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-800">{t("buddy.history.empty")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("empty.buddyStartChatDesc")}</p>
        <button
          type="button"
          onClick={onStartFirstConversation}
          className="mt-4 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          {t("buddy.history.startFirst")}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <HistoryStats userId={userId} refreshKey={statsRefreshKey} />

      <HistoryListHeader />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("buddy.history.search")}
          className="pl-9"
        />
      </div>

      {searching && <p className="text-xs text-slate-500">{t("common.loading")}</p>}

      {!searching && sortedConversations.length === 0 && (
        <p className="text-sm text-slate-500">{t("buddy.history.noResults")}</p>
      )}

      <div className="space-y-3">
        {sortedConversations.map((conversation) => (
          <HistoryConversationCard
            key={conversation.id}
            conversation={conversation}
            displayTitle={(conversation.title || "").trim()}
            fallbackTitle={fallbackTitles[conversation.id]}
            onOpen={() => onSelect(conversation)}
            onRefreshSummary={() => void handleRefreshSummary(conversation.id)}
            isRefreshing={refreshingSummaryId === conversation.id}
            isBackfilling={backfillingIds.has(conversation.id)}
          />
        ))}
      </div>
    </div>
  )
}
