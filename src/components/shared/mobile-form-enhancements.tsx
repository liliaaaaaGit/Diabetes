"use client"

import { useEffect } from "react"

/**
 * On mobile, scroll focused inputs into view so the virtual keyboard does not hide them.
 */
export function MobileFormEnhancements() {
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.matches("input, textarea, select")) return
      if (window.matchMedia("(min-width: 768px)").matches) return

      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" })
      })
    }

    document.addEventListener("focusin", onFocusIn)
    return () => document.removeEventListener("focusin", onFocusIn)
  }, [])

  return null
}
