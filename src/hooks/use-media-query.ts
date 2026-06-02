"use client"

import { useState, useEffect } from "react"

function getMatches(query: string): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia(query).matches
}

/**
 * SSR-safe media query hook. Initial value uses window on first client render
 * so mobile does not briefly mount a desktop Dialog overlay.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatches(query))

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
