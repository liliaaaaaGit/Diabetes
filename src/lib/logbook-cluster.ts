import type { Entry } from "@/lib/types"

/** Group entries whose timestamps fall within this window from the first entry in the cluster. */
export const LOGBOOK_CLUSTER_WINDOW_MS = 5 * 60 * 1000

/**
 * Oldest-first clusters: each cluster spans at most 5 minutes from its first entry.
 * Returns clusters in chronological order (oldest cluster first).
 */
export function clusterEntriesByTime(entries: Entry[]): Entry[][] {
  if (entries.length === 0) return []
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const clusters: Entry[][] = []
  let current: Entry[] = [sorted[0]]
  let anchorMs = new Date(sorted[0].timestamp).getTime()

  for (let i = 1; i < sorted.length; i++) {
    const t = new Date(sorted[i].timestamp).getTime()
    if (t - anchorMs <= LOGBOOK_CLUSTER_WINDOW_MS) {
      current.push(sorted[i])
    } else {
      clusters.push(current)
      current = [sorted[i]]
      anchorMs = t
    }
  }
  clusters.push(current)
  return clusters
}
