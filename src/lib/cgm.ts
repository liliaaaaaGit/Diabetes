import type { Entry } from "@/lib/types"

/**
 * A continuous-glucose-monitor (CGM) stream reading.
 *
 * These are the dense (~15-min) automatic sensor values. They belong in the
 * glucose chart, NOT in the logbook event list — otherwise a single day floods
 * the list with ~90 rows. Mock CGM data is stored with source "import" (the DB
 * only allows manual/conversation/import), so that's how we recognize it.
 *
 * Manual fingerstick glucose (a deliberate user log) has source "manual" or
 * "conversation" and IS a real event that stays in the list.
 */
export function isCgmReading(e: Entry): boolean {
  return e.type === "glucose" && e.source === "import"
}

/** Logbook "events" = everything except the continuous CGM stream. */
export function isLogbookEvent(e: Entry): boolean {
  return !isCgmReading(e)
}
