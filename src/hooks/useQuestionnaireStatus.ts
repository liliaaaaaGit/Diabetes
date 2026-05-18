"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/hooks/useUser"

export function useQuestionnaireStatus() {
  const { userId, isSessionReady } = useUser()
  const [completed, setCompleted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isSessionReady || !userId) {
      setLoaded(true)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/study/questionnaire", { credentials: "include" })
        if (!res.ok) return
        const json = (await res.json()) as {
          response?: { completedAt?: string | null } | null
        }
        if (!cancelled) {
          setCompleted(Boolean(json.response?.completedAt))
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, isSessionReady])

  return { completed, loaded }
}
