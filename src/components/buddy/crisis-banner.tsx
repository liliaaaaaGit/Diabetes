"use client"

import { Phone } from "lucide-react"

export function CrisisBanner() {
  return (
    <div className="mb-3 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-rose-800">
      <div className="flex items-start gap-2">
        <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Wenn du in einer Krise bist:</p>
          <a href="tel:08001110111" className="underline">
            Telefonseelsorge 0800 111 0 111 (24/7, kostenlos, anonym)
          </a>
        </div>
      </div>
    </div>
  )
}
