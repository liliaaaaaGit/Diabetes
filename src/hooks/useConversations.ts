"use client"

import { useCallback, useEffect, useState } from "react"
import { getConversations } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"
import type { Conversation } from "@/lib/types"

export function useConversations(userId: string = DEFAULT_USER_ID) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getConversations(userId)
      setConversations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { conversations, loading, error, refetch }
}

