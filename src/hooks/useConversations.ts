"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversations } from "@/lib/db-client"
import { useTranslation } from "@/hooks/useTranslation"
import { localizeConversationList } from "@/lib/mock-conversation-locale"
import type { Conversation } from "@/lib/types"

type ConversationsCacheItem = {
  /** Raw rows from the API (German mock titles in DB). */
  raw: Conversation[]
  ts: number
}

const CONVERSATIONS_CACHE_TTL_MS = 30_000
const conversationsCache = new Map<string, ConversationsCacheItem>()

export function useConversations(userId: string | null) {
  const { locale } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setConversations([])
      setError(null)
      setLoading(false)
      return
    }
    const cached = conversationsCache.get(userId)
    const isCachedFresh = !!cached && Date.now() - cached.ts < CONVERSATIONS_CACHE_TTL_MS

    if (isCachedFresh) {
      setConversations(localizeConversationList(cached.raw, locale))
      setError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      const raw = await getConversations(userId)
      const data = localizeConversationList(raw, locale)
      setConversations(data)
      conversationsCache.set(userId, { raw, ts: Date.now() })
    } catch (e) {
      if (!isCachedFresh) {
        setError(e instanceof Error ? e.message : "Failed to load conversations")
      }
    } finally {
      setLoading(false)
    }
  }, [userId, locale])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversations, loading, error, refetch }
}
