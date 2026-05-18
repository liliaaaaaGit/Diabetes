"use client"

import { useEffect } from "react"

/** Registers the service worker for PWA / offline app-shell caching. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Registration may fail on insecure contexts or during dev — ignore */
    })
  }, [])

  return null
}
