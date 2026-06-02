"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversations } from "@/lib/db-client"
import type { Conversation } from "@/lib/types"

type ConversationsCacheItem = {
  data: Conversation[]
  ts: number
}

const CONVERSATIONS_CACHE_TTL_MS = 30_000
const conversationsCache = new Map<string, ConversationsCacheItem>()

export function useConversations(userId: string | null) {
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
      setConversations(cached.data)
      setError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await getConversations(userId)
      setConversations(data)
      conversationsCache.set(userId, { data, ts: Date.now() })
    } catch (e) {
      if (!isCachedFresh) {
        setError(e instanceof Error ? e.message : "Failed to load conversations")
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversations, loading, error, refetch }
}
