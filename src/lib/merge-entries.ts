import type { Entry } from "@/lib/types"

/** Merge API results with freshly saved rows (saved rows win on id collision). */
export function mergeEntryLists(api: Entry[], preserve: Entry[]): Entry[] {
  if (preserve.length === 0) return api
  const byId = new Map(api.map((e) => [e.id, e]))
  for (const e of preserve) {
    byId.set(e.id, e)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
