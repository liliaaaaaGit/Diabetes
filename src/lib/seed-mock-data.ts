import { supabaseServer as supabase } from "@/lib/supabase-server"
import { generateSeedData, type SeedData } from "@/lib/seed-mock-data-generator"

type SeedResult = {
  seeded: boolean
  skippedReason?: "existing_entries"
  stats: SeedData["stats"] | null
}

const EMPTY_STATS: SeedData["stats"] = {
  days: 0,
  totalEntries: 0,
  cgmReadings: 0,
  meals: 0,
  insulin: 0,
  moods: 0,
  activities: 0,
  hypoEvents: 0,
  conversations: 0,
}

/** Insert rows in chunks so we never send one gigantic request. */
async function insertChunked<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  chunkSize = 1000
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    if (chunk.length === 0) continue
    const { error } = await supabase.from(table).insert(chunk)
    if (error) throw error
  }
}

/**
 * Delete a user's `entries` in small batches. A single huge `DELETE` (cascading
 * to ~9,000 entry_glucose rows) exceeds the database statement timeout, so we
 * fetch a page of ids and delete those, looping until none are left.
 */
async function deleteEntriesBatched(userId: string, type?: "meal", batchSize = 500) {
  for (;;) {
    let query = supabase.from("entries").select("id").eq("user_id", userId).limit(batchSize)
    if (type) query = query.eq("type", type)
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) break

    const ids = data.map((row) => (row as { id: string }).id)
    const del = await supabase.from("entries").delete().in("id", ids)
    if (del.error) throw del.error
    if (data.length < batchSize) break
  }
}

/**
 * Delete every piece of mock data for a user, respecting foreign-key order.
 * The user row itself is kept. `entry_*` and `messages` are removed
 * automatically via ON DELETE CASCADE when their parent is deleted.
 *
 * Note: `entry_meal.linked_insulin_id` references `entries(id)` WITHOUT cascade,
 * so deleting an insulin entry that a meal still points at would fail. We dodge
 * this by deleting the user's MEAL entries first — that cascades away the
 * entry_meal rows (and their linked_insulin_id references) before we remove the
 * insulin entries in the second pass.
 */
async function deleteAllUserData(userId: string) {
  // 1. conversations → cascades to messages
  const convDel = await supabase.from("conversations").delete().eq("user_id", userId)
  if (convDel.error) throw convDel.error
  // 2. meal entries first → cascades to entry_meal (clears linked_insulin refs)
  await deleteEntriesBatched(userId, "meal")
  // 3. remaining entries (glucose/insulin/mood/activity) → cascades to subtype rows
  await deleteEntriesBatched(userId)
  // 4. insights
  const insightDel = await supabase.from("insights").delete().eq("user_id", userId)
  if (insightDel.error) throw insightDel.error
  // 5. goals
  const goalDel = await supabase.from("goals").delete().eq("user_id", userId)
  if (goalDel.error) throw goalDel.error
}

async function insertSeedData(data: SeedData) {
  // Parent rows first (entries before their subtype rows).
  // Sort entries chronologically so any UI relying on insertion order is happy.
  const entries = [...data.entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  await insertChunked("entries", entries)

  // Subtype rows can go in parallel (each references an already-inserted entry).
  await Promise.all([
    insertChunked("entry_glucose", data.glucose),
    insertChunked("entry_insulin", data.insulin),
    insertChunked("entry_meal", data.meals),
    insertChunked("entry_mood", data.mood),
    insertChunked("entry_activity", data.activity),
  ])

  // Conversations before their messages.
  await insertChunked("conversations", data.conversations)
  await insertChunked("messages", data.messages)

  // Insights + goals are independent.
  await Promise.all([
    insertChunked("insights", data.insights),
    insertChunked("goals", data.goals),
  ])
}

/**
 * Seed a realistic 3-month dataset (May 1 – Aug 1, 2026).
 * - Without `force`, it skips if the user already has entries (used on registration).
 * - With `force`, it does NOT delete on its own — callers that want a clean
 *   reseed should use `reseedMockDataForUser`.
 */
export async function seedMockDataForUser(
  userId: string,
  options?: { force?: boolean }
): Promise<SeedResult> {
  const force = options?.force === true

  const { count, error: countError } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (countError) throw countError
  if (!force && (count ?? 0) > 0) {
    return { seeded: false, skippedReason: "existing_entries", stats: EMPTY_STATS }
  }

  const data = generateSeedData(userId)
  await insertSeedData(data)

  return { seeded: true, stats: data.stats }
}

/** Delete all existing mock data for the user, then seed fresh. */
export async function reseedMockDataForUser(userId: string): Promise<SeedResult> {
  await deleteAllUserData(userId)
  const data = generateSeedData(userId)
  await insertSeedData(data)
  return { seeded: true, stats: data.stats }
}

type ReseedAllResult = {
  users: number
  totalEntries: number
  failures: Array<{ userId: string; error: string }>
}

/**
 * Delete old mock data and insert the fresh set for EVERY account.
 * Processes users one at a time so a single failure doesn't abort the rest.
 */
export async function reseedAllUsersMockData(): Promise<ReseedAllResult> {
  const { data, error } = await supabase.from("users").select("id")
  if (error) throw error

  const result: ReseedAllResult = { users: 0, totalEntries: 0, failures: [] }
  for (const row of data ?? []) {
    const userId = (row as { id: string }).id
    try {
      const r = await reseedMockDataForUser(userId)
      result.users += 1
      result.totalEntries += r.stats?.totalEntries ?? 0
    } catch (e) {
      result.failures.push({ userId, error: e instanceof Error ? e.message : String(e) })
    }
  }
  return result
}
