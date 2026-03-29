"use client"

import type { Entry } from "@/lib/types"
import { LogbookUnifiedEntryCard } from "./logbook-unified-entry-card"

interface EntryCardProps {
  entry: Entry
}

/** @deprecated Prefer LogbookUnifiedEntryCard with a one-element array */
export function EntryCard({ entry }: EntryCardProps) {
  return <LogbookUnifiedEntryCard entries={[entry]} />
}
