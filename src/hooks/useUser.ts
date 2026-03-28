"use client"

import { useEffect, useState } from "react"

export interface UserInfo {
  userId: string | null
  pseudonym: string | null
  isLoggedIn: boolean
}

export function useUser(): UserInfo {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userId: null,
    pseudonym: null,
    isLoggedIn: false,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    void fetch("/api/auth/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { userId?: string | null; pseudonym?: string | null } | null) => {
        if (!data) {
          setUserInfo({ userId: null, pseudonym: null, isLoggedIn: false })
          return
        }
        setUserInfo({
          userId: data.userId ?? null,
          pseudonym: data.pseudonym ?? null,
          isLoggedIn: Boolean(data.userId),
        })
      })
      .catch(() => {
        setUserInfo({ userId: null, pseudonym: null, isLoggedIn: false })
      })
  }, [])

  return userInfo
}
