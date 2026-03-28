"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversation } from "@/lib/db"
import type { Conversation } from "@/lib/types"

export function useConversation(conversationId: string | undefined, userId: string | null) {
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
      const data = await getConversation(conversationId, userId)
      setConversation(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }, [conversationId, userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversation, loading, error, refetch }
}
