"use client"

import type { Entry } from "@/lib/types"
import { LogbookUnifiedEntryCard } from "./logbook-unified-entry-card"

interface ConsolidatedEntryCardProps {
  entries: Entry[]
}

/** @deprecated Prefer LogbookUnifiedEntryCard */
export function ConsolidatedEntryCard({ entries }: ConsolidatedEntryCardProps) {
  return <LogbookUnifiedEntryCard entries={entries} />
}
