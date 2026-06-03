"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversation } from "@/lib/db-client"
import { useTranslation } from "@/hooks/useTranslation"
import { localizeConversationWithMessages } from "@/lib/mock-conversation-locale"
import type { Conversation } from "@/lib/types"

export function useConversation(conversationId: string | undefined, userId: string | null) {
  const { locale } = useTranslation()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!conversationId || !userId) {
      setConversation(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = localizeConversationWithMessages(
        await getConversation(conversationId, userId),
        locale
      )
      setConversation(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }, [conversationId, userId, locale])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversation, loading, error, refetch }
}
