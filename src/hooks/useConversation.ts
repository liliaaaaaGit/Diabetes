"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversation } from "@/lib/db"
import type { Conversation } from "@/lib/types"

export function useConversation(conversationId?: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getConversation(conversationId)
      setConversation(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversation, loading, error, refetch }
}

