"use client"

import { useEffect, useState } from "react"

export interface UserInfo {
  userId: string | null
  pseudonym: string | null
  isLoggedIn: boolean
}

// Helper to get cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null
  }
  return null
}

export function useUser(): UserInfo {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userId: null,
    pseudonym: null,
    isLoggedIn: false,
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    const userId = getCookie("gc_user_id") || null
    const pseudonym = getCookie("gc_pseudonym") || null

    setUserInfo({
      userId,
      pseudonym,
      isLoggedIn: !!userId,
    })
  }, [])

  return userInfo
}
