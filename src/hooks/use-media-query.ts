"use client"

import { useState, useEffect } from "react"

/**
 * SSR-safe media query hook. Returns `false` until mounted, then the real value.
 * Prefer CSS breakpoints (md:hidden) when a layout flash would be jarring.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  if (!mounted) return false
  return matches
}
