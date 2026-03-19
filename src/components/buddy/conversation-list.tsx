"use client"

import { useEffect, useMemo, useState } from "react"
import { Conversation } from "@/lib/types"
import { ConversationCard } from "./conversation-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useTranslation } from "@/hooks/useTranslation"
import { MessageCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchConversations } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { HistoryStats } from "./history-stats"

interface ConversationListProps {
  conversations: Conversation[]
  onSelect: (conversation: Conversation) => void
  onStartFirstConversation: () => void
  backfillingIds?: Set<string>
  statsRefreshKey?: number
}

export function ConversationList({
  conversations,
  onSelect,
  onStartFirstConversation,
  backfillingIds = new Set<string>(),
  statsRefreshKey = 0,
}: ConversationListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState<Conversation[]>(conversations)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setFiltered(conversations)
  }, [conversations])

  useEffect(() => {
    const id = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          setFiltered(conversations)
          return
        }
        setSearching(true)
        try {
          const rows = await searchConversations(DEFAULT_USER_ID, query.trim())
          setFiltered(rows)
        } finally {
          setSearching(false)
        }
      })()
    }, 300)

    return () => clearTimeout(id)
  }, [conversations, query])

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-800">{t("buddy.history.empty")}</p>
        <p className="mt-1 text-sm text-slate-500">Starte dein erstes Gespräch mit deinem Diabetes-Buddy!</p>
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

  return (
    <div className="space-y-3">
      <HistoryStats refreshKey={statsRefreshKey} />

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

      {sortedConversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          onClick={() => onSelect(conversation)}
          isBackfilling={backfillingIds.has(conversation.id)}
        />
      ))}
    </div>
  )
}
