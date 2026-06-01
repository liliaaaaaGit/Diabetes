"use client"

import { Info } from "lucide-react"

export function CrisisBanner() {
  return (
    <div className="mb-3 rounded-lg border border-gray-200 border-l-4 border-l-gray-400 bg-gray-100 px-4 py-3 text-gray-700">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" aria-hidden />
        <div className="text-sm">
          <p className="font-medium text-gray-800">Wenn du in einer Krise bist:</p>
          <a href="tel:08001110111" className="font-semibold text-gray-900 underline">
            Telefonseelsorge 0800 111 0 111
          </a>
          <p className="text-gray-500">kostenlos, rund um die Uhr, anonym</p>
        </div>
      </div>
    </div>
  )
}
