"use client"

import { Conversation } from "@/lib/types"
import { ConversationCard } from "./conversation-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useTranslation } from "@/hooks/useTranslation"
import { Calendar, MessageCircle } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"

interface ConversationListProps {
  conversations: Conversation[]
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({
  conversations,
  onSelect,
}: ConversationListProps) {
  const { t } = useTranslation()

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title={t("empty.noConversations")}
        description={t("empty.noConversationsDesc")}
      />
    )
  }

  const now = new Date()
  const thisMonthCount = conversations.filter((c) => {
    const d = new Date(c.startedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const avgLength =
    conversations.length > 0
      ? Math.round(
          conversations.reduce(
            (acc, c) => acc + (c.messageCount ?? c.messages.length ?? 0),
            0
          ) /
            conversations.length
        )
      : 0

  return (
    <div className="space-y-3">
      {/* History Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={t("buddy.totalConversations")}
          value={conversations.length}
          icon={MessageCircle}
          color="blue"
        />
        <StatCard
          label={t("buddy.thisMonth")}
          value={thisMonthCount}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          label={t("buddy.avgLength")}
          value={avgLength}
          unit={t("buddy.messages")}
          icon={MessageCircle}
          color="green"
        />
      </div>

      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          onClick={() => onSelect(conversation)}
        />
      ))}
    </div>
  )
}
