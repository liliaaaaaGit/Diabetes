import { supabase } from "@/lib/supabase"
import type {
  Entry,
  EntryType,
  GlucoseEntry,
  GlucoseUnit,
  InsulinEntry,
  InsulinType,
  MealEntry,
  MealType,
  ActivityEntry,
  MoodEntry,
  MoodValue,
  DashboardStats,
  Conversation,
  ConversationTag,
  ConversationEmotions,
  Message,
  Insight,
  Goal,
  NewEntry,
  NewGoal,
} from "@/lib/types"
const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v
  if (typeof v === "string") return Number(v)
  return Number(v)
}

function normalizeConversationTagsFromDb(raw: unknown): ConversationTag[] {
  if (raw == null) return []
  if (!Array.isArray(raw)) return []
  const out: ConversationTag[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ emoji: "·", label: s })
      continue
    }
    if (item && typeof item === "object" && "label" in item) {
      const emoji = String((item as { emoji?: unknown }).emoji ?? "·").trim() || "·"
      const label = String((item as { label?: unknown }).label ?? "").trim()
      if (label) out.push({ emoji, label })
    }
  }
  return out
}

function normalizeConversationEmotionsFromDb(raw: unknown): ConversationEmotions | null {
  if (raw == null || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const clamp = (v: unknown) => {
    const x = typeof v === "number" ? v : Number(v)
    if (!Number.isFinite(x)) return 0
    return Math.max(0, Math.min(1, x))
  }
  return {
    happiness: clamp(o.happiness),
    surprise: clamp(o.surprise),
    sadness: clamp(o.sadness),
    anger: clamp(o.anger),
    fear: clamp(o.fear),
    disgust: clamp(o.disgust),
  }
}

const mmolToMgdl = (mmol: number) => mmol * 18.0182

export async function deleteEntry(entryId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", entryId).eq("user_id", userId)
  if (error) throw error
}

async function getEntryById(entryId: string, userId: string): Promise<Entry> {
  const { data: baseRows, error: baseError } = await supabase
    .from("entries")
    .select("id,user_id,source,type,timestamp,note,created_at,conversation_id")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle()

  if (baseError) throw baseError
  if (!baseRows) throw new Error("Entry not found")

  const base = baseRows as any
  const type: EntryType = base.type

  const common = {
    id: base.id as string,
    userId: base.user_id as string,
    type,
    timestamp: new Date(base.timestamp).toISOString(),
    note: base.note || undefined,
    createdAt: new Date(base.created_at).toISOString(),
    source: base.source,
    conversationId: base.conversation_id || undefined,
  }

  if (type === "glucose") {
    const { data, error } = await supabase
      .from("entry_glucose")
      .select("entry_id,value,context")
      .eq("entry_id", entryId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Glucose row missing")

    return {
      ...(common as any),
      type: "glucose",
      value: toNumber((data as any).value),
      unit: "mg_dl",
      context: (data as any).context,
    }
  }

  if (type === "insulin") {
    const { data, error } = await supabase
      .from("entry_insulin")
      .select("entry_id,dose,insulin_type,insulin_name")
      .eq("entry_id", entryId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Insulin row missing")

    return {
      ...(common as any),
      type: "insulin",
      dose: toNumber((data as any).dose),
      insulinType: (data as any).insulin_type,
      insulinName: (data as any).insulin_name || undefined,
    }
  }

  if (type === "meal") {
    const { data, error } = await supabase
      .from("entry_meal")
      .select("entry_id,description,carbs_grams,meal_type,linked_insulin_id")
      .eq("entry_id", entryId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Meal row missing")

    return {
      ...(common as any),
      type: "meal",
      description: (data as any).description,
      carbsGrams:
        (data as any).carbs_grams === null ? undefined : toNumber((data as any).carbs_grams),
      mealType: (data as any).meal_type,
      linkedInsulinEntryId: (data as any).linked_insulin_id || undefined,
    }
  }

  if (type === "activity") {
    const { data, error } = await supabase
      .from("entry_activity")
      .select("entry_id,activity_type,duration_minutes,intensity")
      .eq("entry_id", entryId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Activity row missing")

    return {
      ...(common as any),
      type: "activity",
      activityType: (data as any).activity_type,
      durationMinutes:
        (data as any).duration_minutes === null
          ? 0
          : Math.round(toNumber((data as any).duration_minutes)),
      intensity: (data as any).intensity,
    }
  }

  // mood
  const { data, error } = await supabase
    .from("entry_mood")
    .select("entry_id,mood_value")
    .eq("entry_id", entryId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Mood row missing")

  return {
    ...(common as any),
    type: "mood",
    moodValue: toNumber((data as any).mood_value) as MoodValue,
  }
}

export async function createEntry(userId: string, entry: NewEntry | Entry): Promise<Entry> {
  const {
    type,
    timestamp,
    note,
    source,
    conversationId,
    context,
    unit,
    value,
    insulinType,
    insulinName,
    dose,
    description,
    carbsGrams,
    mealType,
    activityType,
    durationMinutes,
    intensity,
    moodValue,
    linkedInsulinEntryId,
  } = entry as any

  const { data: inserted, error: insertError } = await supabase
    .from("entries")
    .insert({
      user_id: userId,
      source,
      type,
      timestamp: timestamp ? timestamp : new Date().toISOString(),
      note: note || null,
      conversation_id: conversationId || null,
    })
    .select("id")
    .maybeSingle()

  if (insertError) throw insertError
  if (!inserted?.id) throw new Error("Failed to create entry")

  const entryId = inserted.id as string

  try {
    if (type === "glucose") {
      const glucoseMgdl =
        unit === "mmol_l" ? mmolToMgdl(toNumber(value)) : toNumber(value)

      const { error } = await supabase.from("entry_glucose").insert({
        entry_id: entryId,
        value: glucoseMgdl,
        context,
      })
      if (error) throw error
    }

    if (type === "insulin") {
      const { error } = await supabase.from("entry_insulin").insert({
        entry_id: entryId,
        dose: dose,
        insulin_type: insulinType,
        insulin_name: insulinName || null,
      })
      if (error) throw error
    }

    if (type === "meal") {
      const { error } = await supabase.from("entry_meal").insert({
        entry_id: entryId,
        description,
        carbs_grams: carbsGrams ?? null,
        meal_type: mealType,
        linked_insulin_id: linkedInsulinEntryId || null,
      })
      if (error) throw error
    }

    if (type === "activity") {
      const { error } = await supabase.from("entry_activity").insert({
        entry_id: entryId,
        activity_type: activityType,
        duration_minutes: durationMinutes ?? null,
        intensity,
      })
      if (error) throw error
    }

    if (type === "mood") {
      const { error } = await supabase.from("entry_mood").insert({
        entry_id: entryId,
        mood_value: moodValue,
      })
      if (error) throw error
    }

    return await getEntryById(entryId, userId)
  } catch (e) {
    // Roll back base row if type-specific insert fails
    await supabase.from("entries").delete().eq("id", entryId)
    throw e
  }
}

export async function getEntries(
  userId: string,
  filters?: {
    type?: EntryType
    from?: string
    to?: string
    limit?: number
  }
): Promise<Entry[]> {
  let query = supabase
    .from("entries")
    .select("id,user_id,source,type,timestamp,note,created_at,conversation_id")
    .eq("user_id", userId)

  if (filters?.type) query = query.eq("type", filters.type)
  if (filters?.from) query = query.gte("timestamp", filters.from)
  if (filters?.to) query = query.lt("timestamp", filters.to)

  query = query.order("timestamp", { ascending: false })
  if (filters?.limit) query = query.limit(filters.limit)

  const { data: baseRows, error } = await query
  if (error) throw error

  const base = (baseRows || []) as any[]
  const byType: Record<EntryType, string[]> = {
    glucose: [],
    insulin: [],
    meal: [],
    activity: [],
    mood: [],
  }
  base.forEach((row) => {
    const entryType = row.type as EntryType
    if (entryType in byType) {
      byType[entryType].push(row.id as string)
    }
  })

  const glucoseIds = byType.glucose
  const insulinIds = byType.insulin
  const mealIds = byType.meal
  const activityIds = byType.activity
  const moodIds = byType.mood

  const [glucoseRows, insulinRows, mealRows, activityRows, moodRows] = await Promise.all([
    glucoseIds.length
      ? supabase.from("entry_glucose").select("entry_id,value,context").in("entry_id", glucoseIds)
      : Promise.resolve({ data: [], error: null }),
    insulinIds.length
      ? supabase.from("entry_insulin").select("entry_id,dose,insulin_type,insulin_name").in("entry_id", insulinIds)
      : Promise.resolve({ data: [], error: null }),
    mealIds.length
      ? supabase.from("entry_meal").select("entry_id,description,carbs_grams,meal_type,linked_insulin_id").in("entry_id", mealIds)
      : Promise.resolve({ data: [], error: null }),
    activityIds.length
      ? supabase.from("entry_activity").select("entry_id,activity_type,duration_minutes,intensity").in("entry_id", activityIds)
      : Promise.resolve({ data: [], error: null }),
    moodIds.length
      ? supabase.from("entry_mood").select("entry_id,mood_value").in("entry_id", moodIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const indexById = <T extends Record<string, any>>(arr: T[]) =>
    arr.reduce((acc, item) => {
      acc[item.entry_id] = item
      return acc
    }, {} as Record<string, T>)

  const glucoseMap = indexById(glucoseRows.data as any[])
  const insulinMap = indexById(insulinRows.data as any[])
  const mealMap = indexById(mealRows.data as any[])
  const activityMap = indexById(activityRows.data as any[])
  const moodMap = indexById(moodRows.data as any[])

  const result: Entry[] = base.map((row) => {
    const common = {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      timestamp: new Date(row.timestamp).toISOString(),
      note: row.note || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      source: row.source,
    } as any

    const entryType = row.type as EntryType
    if (entryType === "glucose") {
      const g = glucoseMap[row.id]
      return {
        ...(common as any),
        type: "glucose",
        value: toNumber(g.value),
        unit: "mg_dl" as GlucoseUnit,
        context: g.context,
      } satisfies GlucoseEntry
    }

    if (entryType === "insulin") {
      const i = insulinMap[row.id]
      return {
        ...(common as any),
        type: "insulin",
        dose: toNumber(i.dose),
        insulinType: i.insulin_type as InsulinType,
        insulinName: i.insulin_name || undefined,
      } satisfies InsulinEntry
    }

    if (entryType === "meal") {
      const m = mealMap[row.id]
      return {
        ...(common as any),
        type: "meal",
        description: m.description,
        carbsGrams: m.carbs_grams === null ? undefined : toNumber(m.carbs_grams),
        mealType: m.meal_type as MealType,
        linkedInsulinEntryId: m.linked_insulin_id || undefined,
      } satisfies MealEntry
    }

    if (entryType === "activity") {
      const a = activityMap[row.id]
      return {
        ...(common as any),
        type: "activity",
        activityType: a.activity_type,
        durationMinutes: a.duration_minutes === null ? 0 : Math.round(toNumber(a.duration_minutes)),
        intensity: a.intensity,
      } satisfies ActivityEntry
    }

    const md = moodMap[row.id]
    return {
      ...(common as any),
      type: "mood",
      moodValue: toNumber(md.mood_value) as MoodValue,
    } satisfies MoodEntry
  })

  return result
}

export async function getRecentEntries(userId: string, limit: number): Promise<Entry[]> {
  return getEntries(userId, { limit }).then((arr) =>
    [...arr].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date()
  const start7d = new Date(now)
  start7d.setDate(now.getDate() - 7)

  const glucoseEntries = await getEntries(userId, {
    type: "glucose",
    from: start7d.toISOString(),
  })

  const glucose = glucoseEntries as GlucoseEntry[]
  const entriesToday = glucoseEntries.filter((e) => {
    const d = new Date(e.timestamp)
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    return isSameDay
  }).length

  const avgGlucose =
    glucose.length > 0
      ? Math.round((glucose.reduce((sum, e) => sum + e.value, 0) / glucose.length) * 10) / 10
      : 0

  const inRangeCount = glucose.filter((e) => e.value >= 70 && e.value <= 180).length
  const timeInRange = glucose.length > 0 ? Math.round((inRangeCount / glucose.length) * 100) : 0

  const last = [...glucose].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  return {
    avgGlucose,
    unit: "mg_dl",
    entriesToday,
    timeInRange,
    lastGlucose: last
      ? {
          value: last.value,
          timestamp: last.timestamp,
          context: last.context,
        }
      : undefined,
  }
}

export async function createConversation(userId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, is_active: true })
    .select("*")
    .maybeSingle()
  if (error) throw error

  const row = data as any
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || undefined,
    summary: row.summary || undefined,
    dominantEmoji: row.mood_emoji || undefined,
    tags: normalizeConversationTagsFromDb(row.tags),
    emotions: normalizeConversationEmotionsFromDb(row.emotions),
    messageCount: 0,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : undefined,
    isActive: row.is_active,
    messages: [],
  }
}

export async function getConversation(conversationId: string, userId: string): Promise<Conversation> {
  const { data: convRow, error } = await supabase
    .from("conversations")
    .select("id,user_id,title,summary,tags,mood_emoji,emotions,started_at,ended_at,is_active")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  if (!convRow) throw new Error("Conversation not found")

  const { data: messageRows, error: msgErr } = await supabase
    .from("messages")
    .select("id,conversation_id,role,content,timestamp")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true })
  if (msgErr) throw msgErr

  return {
    id: (convRow as any).id,
    userId: (convRow as any).user_id,
    title: (convRow as any).title || undefined,
    summary: (convRow as any).summary || undefined,
    dominantEmoji: (convRow as any).mood_emoji || undefined,
    tags: normalizeConversationTagsFromDb((convRow as any).tags),
    emotions: normalizeConversationEmotionsFromDb((convRow as any).emotions),
    messageCount: messageRows?.length ?? 0,
    startedAt: new Date((convRow as any).started_at).toISOString(),
    endedAt: (convRow as any).ended_at ? new Date((convRow as any).ended_at).toISOString() : undefined,
    isActive: (convRow as any).is_active,
    messages: (messageRows || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).toISOString(),
    })),
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: convRows, error } = await supabase
    .from("conversations")
    .select("id,user_id,title,summary,tags,mood_emoji,emotions,started_at,ended_at,is_active")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
  if (error) throw error

  const convs = (convRows || []) as any[]
  const ids = convs.map((c) => c.id)
  if (ids.length === 0) return []

  const { data: msgRows, error: msgErr } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", ids)
  if (msgErr) throw msgErr

  const counts = (msgRows || []).reduce((acc: Record<string, number>, m: any) => {
    acc[m.conversation_id] = (acc[m.conversation_id] || 0) + 1
    return acc
  }, {})

  return convs.map((c) => ({
    id: c.id,
    userId: c.user_id,
    title: c.title || undefined,
    summary: c.summary || undefined,
    dominantEmoji: c.mood_emoji || undefined,
    tags: normalizeConversationTagsFromDb(c.tags),
    emotions: normalizeConversationEmotionsFromDb(c.emotions),
    startedAt: new Date(c.started_at).toISOString(),
    endedAt: c.ended_at ? new Date(c.ended_at).toISOString() : undefined,
    isActive: c.is_active,
    messageCount: counts[c.id] || 0,
    // messages are loaded only when opening a conversation
    messages: [],
  }))
}

/** Latest ended chats with summaries — for Buddy “first message in new thread” context. */
export async function getRecentEndedConversationSummaries(
  userId: string,
  options?: { excludeConversationId?: string; limit?: number }
): Promise<Array<{ title: string; summary: string; dateLabel: string }>> {
  const raw = options?.limit ?? 5
  const limit = Math.min(Math.max(raw, 1), 10)
  const excludeId = options?.excludeConversationId

  const { data: rows, error } = await supabase
    .from("conversations")
    .select("id,title,summary,started_at,ended_at")
    .eq("user_id", userId)
    .eq("is_active", false)

  if (error) throw error

  return (rows || [])
    .filter((r: any) => (excludeId ? r.id !== excludeId : true))
    .filter((r: any) => typeof r.summary === "string" && r.summary.trim().length > 0)
    .map((r: any) => {
      const when = r.ended_at || r.started_at
      return {
        title: typeof r.title === "string" && r.title.trim() ? r.title.trim() : "Ohne Titel",
        summary: String(r.summary).trim(),
        dateLabel: new Date(when).toISOString().slice(0, 10),
        sortKey: new Date(when).getTime(),
      }
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, limit)
    .map(({ title, summary, dateLabel }) => ({ title, summary, dateLabel }))
}

export async function searchConversations(userId: string, query: string): Promise<Conversation[]> {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return getConversations(userId)

  const all = await getConversations(userId)
  return all.filter((c) => {
    const title = (c.title || "").toLowerCase()
    const summary = (c.summary || "").toLowerCase()
    const tags = (c.tags || [])
      .map((t) => `${t.label} ${t.emoji}`.toLowerCase())
      .join(" ")
    return title.includes(normalized) || summary.includes(normalized) || tags.includes(normalized)
  })
}

/** Ended conversations with messages + total messages across all convos (Buddy stats tab). */
export async function getBuddyStatsTotals(userId: string): Promise<{
  convosCompleted: number
  totalMessages: number
}> {
  const conversations = await getConversations(userId)
  const convosCompleted = conversations.filter(
    (c) => !c.isActive && (c.messageCount ?? c.messages.length ?? 0) > 0
  ).length
  const totalMessages = conversations.reduce(
    (acc, c) => acc + (c.messageCount ?? c.messages.length ?? 0),
    0
  )
  return { convosCompleted, totalMessages }
}

/** Average each emotion dimension over conversations that have `emotions` jsonb set. */
export async function getEmotionAverages(userId: string): Promise<ConversationEmotions | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("emotions")
    .eq("user_id", userId)
    .not("emotions", "is", null)

  if (error) throw error

  const parsed = (data || [])
    .map((row: { emotions?: unknown }) => normalizeConversationEmotionsFromDb(row.emotions))
    .filter((e): e is ConversationEmotions => e != null)

  if (parsed.length === 0) return null

  const keys: (keyof ConversationEmotions)[] = [
    "happiness",
    "surprise",
    "sadness",
    "anger",
    "fear",
    "disgust",
  ]
  const out = {} as ConversationEmotions
  for (const k of keys) {
    out[k] = parsed.reduce((sum, row) => sum + row[k], 0) / parsed.length
  }
  return out
}

export async function getConversationStats(userId: string): Promise<{
  total: number
  thisMonth: number
  avgLength: number
}> {
  const conversations = await getConversations(userId)
  const now = new Date()
  const total = conversations.length
  const thisMonth = conversations.filter((c) => {
    const d = new Date(c.startedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const avgLength =
    total > 0
      ? Math.round(
          conversations.reduce((acc, c) => acc + (c.messageCount ?? c.messages.length ?? 0), 0) / total
        )
      : 0
  return { total, thisMonth, avgLength }
}

export async function cleanupEmptyConversations(userId: string): Promise<number> {
  const conversations = await getConversations(userId)
  const emptyIds = conversations
    .filter((c) => (c.messageCount ?? c.messages.length ?? 0) === 0)
    .map((c) => c.id)
  if (emptyIds.length === 0) return 0

  const { error } = await supabase
    .from("conversations")
    .delete()
    .in("id", emptyIds)
    .eq("user_id", userId)
  if (error) throw error
  return emptyIds.length
}

export async function endConversation(conversationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function dismissInsight(insightId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("insights")
    .update({ dismissed: true })
    .eq("id", insightId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function getInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase
    .from("insights")
    .select("id,user_id,type,title,description,category,created_at,dismissed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    category: row.category,
    createdAt: new Date(row.created_at).toISOString(),
    dismissed: row.dismissed,
  }))
}

export async function createInsight(insight: {
  userId: string
  type: Insight["type"]
  title: string
  description: string
  category: string
}): Promise<Insight> {
  const { data, error } = await supabase
    .from("insights")
    .insert({
      user_id: insight.userId,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      category: insight.category,
    })
    .select("*")
    .maybeSingle()
  if (error) throw error

  const row = data as any
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    category: row.category,
    createdAt: new Date(row.created_at).toISOString(),
    dismissed: row.dismissed,
  }
}

export async function createGoal(goal: NewGoal): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: goal.userId,
      title: goal.title,
      description: goal.description,
      target_days: goal.targetDays ?? 7,
      active: goal.active ?? true,
    })
    .select("*")
    .maybeSingle()
  if (error) throw error

  const row = data as any
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    targetDays: row.target_days,
    completedDays: row.completed_days,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("id,user_id,title,description,target_days,completed_days,active,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    targetDays: row.target_days,
    completedDays: row.completed_days,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function updateGoalProgress(goalId: string, completedDays: number, userId: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ completed_days: completedDays })
    .eq("id", goalId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function addMessage(
  conversationId: string,
  role: Message["role"],
  content: string,
  userId: string
): Promise<Message> {
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle()
  if (convErr) throw convErr
  if (!conv) throw new Error("Conversation not found")

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select("*")
    .maybeSingle()
  if (error) throw error

  const row = data as any
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.timestamp).toISOString(),
  }
}

export async function updateConversationSummary(
  conversationId: string,
  userId: string,
  summary: string,
  tags: ConversationTag[],
  moodEmoji: string,
  title?: string,
  emotions?: ConversationEmotions | null
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({
      summary,
      tags,
      mood_emoji: moodEmoji,
      title: title || summaryToTitle(summary),
      emotions: emotions ?? null,
    })
    .eq("id", conversationId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function updateConversationTitle(conversationId: string, title: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("user_id", userId)
  if (error) throw error
}

function summaryToTitle(summary: string): string {
  const cleaned = summary.trim()
  if (!cleaned) return "—"
  const firstSentence = cleaned.split(/[.!?]\s/)[0] || cleaned
  return firstSentence.slice(0, 60)
}
