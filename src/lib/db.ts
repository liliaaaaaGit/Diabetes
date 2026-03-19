import { supabase } from "@/lib/supabase"
import {
  DEFAULT_USER_ID,
  // existing constants in file
} from "@/lib/constants"
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
  InsulinEntry as InsulinEntryType,
  DashboardStats,
  Conversation,
  Message,
  Insight,
  Goal,
  NewEntry,
  NewGoal,
} from "@/lib/types"
import {
  mockEntries,
  mockConversations,
  mockInsights,
  getDashboardStats as getMockDashboardStats,
  getRecentEntries as getMockRecentEntries,
} from "@/lib/mock-data"

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v
  if (typeof v === "string") return Number(v)
  return Number(v)
}

const mmolToMgdl = (mmol: number) => mmol * 18.0182
const mgdlToMmol = (mgdl: number) => mgdl / 18.0182

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}`

// In-memory stores for mock mode
let entriesStore: Entry[] = [...mockEntries]
let conversationsStore: Conversation[] = [...mockConversations]
let insightsStore: Insight[] = [...mockInsights]
let goalsStore: Goal[] = []

export async function deleteEntry(entryId: string): Promise<void> {
  if (USE_MOCK) {
    entriesStore = entriesStore.filter((e) => e.id !== entryId)
    return
  }

  const { error } = await supabase.from("entries").delete().eq("id", entryId)
  if (error) throw error
}

async function getEntryById(entryId: string, userId: string): Promise<Entry> {
  if (USE_MOCK) {
    const found = entriesStore.find((e) => e.id === entryId)
    if (!found) throw new Error("Entry not found")
    return found
  }

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

export async function createEntry(entry: NewEntry | Entry): Promise<Entry> {
  if (USE_MOCK) {
    const id = uuid()
    const createdAt = new Date().toISOString()
    const userId = DEFAULT_USER_ID

    const stored = { ...(entry as any), id, userId, createdAt } as Entry
    entriesStore = [stored, ...entriesStore]
    return stored
  }

  const userId = DEFAULT_USER_ID
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
  if (USE_MOCK) {
    let arr = entriesStore
    if (filters?.type) arr = arr.filter((e) => e.type === filters.type)
    if (filters?.from) arr = arr.filter((e) => new Date(e.timestamp) >= new Date(filters.from!))
    if (filters?.to) arr = arr.filter((e) => new Date(e.timestamp) < new Date(filters.to!))
    if (filters?.limit) arr = arr.slice(0, filters.limit)
    return [...arr].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

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
  if (USE_MOCK) return getMockRecentEntries(limit)

  return getEntries(userId, { limit }).then((arr) =>
    [...arr].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  if (USE_MOCK) return getMockDashboardStats("mg_dl")

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
  if (USE_MOCK) {
    const id = uuid()
    const conv: Conversation = {
      id,
      userId,
      title: "Neue Unterhaltung",
      summary: "",
      dominantEmoji: undefined,
      tags: [],
      messageCount: 0,
      startedAt: new Date().toISOString(),
      endedAt: undefined,
      isActive: true,
      messages: [],
    }
    conversationsStore = [conv, ...conversationsStore]
    return conv
  }

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
    tags: row.tags || [],
    messageCount: 0,
    startedAt: new Date(row.started_at).toISOString(),
    endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : undefined,
    isActive: row.is_active,
    messages: [],
  }
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  if (USE_MOCK) {
    const found = conversationsStore.find((c) => c.id === conversationId)
    if (!found) throw new Error("Conversation not found")
    return found
  }

  const { data: convRow, error } = await supabase
    .from("conversations")
    .select("id,user_id,title,summary,tags,mood_emoji,started_at,ended_at,is_active")
    .eq("id", conversationId)
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
    tags: (convRow as any).tags || [],
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
  if (USE_MOCK) {
    return [...conversationsStore].sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ).map((c) => ({
      ...c,
      messageCount: c.messages.length,
    }))
  }

  const { data: convRows, error } = await supabase
    .from("conversations")
    .select("id,user_id,title,summary,tags,mood_emoji,started_at,ended_at,is_active")
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
    tags: c.tags || [],
    startedAt: new Date(c.started_at).toISOString(),
    endedAt: c.ended_at ? new Date(c.ended_at).toISOString() : undefined,
    isActive: c.is_active,
    messageCount: counts[c.id] || 0,
    // messages are loaded only when opening a conversation
    messages: [],
  }))
}

export async function endConversation(conversationId: string): Promise<void> {
  if (USE_MOCK) {
    conversationsStore = conversationsStore.map((c) =>
      c.id === conversationId ? { ...c, isActive: false, endedAt: new Date().toISOString() } : c
    )
    return
  }

  const { error } = await supabase
    .from("conversations")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", conversationId)
  if (error) throw error
}

export async function dismissInsight(insightId: string): Promise<void> {
  if (USE_MOCK) {
    insightsStore = insightsStore.map((i) =>
      i.id === insightId ? { ...i, dismissed: true } : i
    )
    return
  }

  const { error } = await supabase
    .from("insights")
    .update({ dismissed: true })
    .eq("id", insightId)
  if (error) throw error
}

export async function getInsights(userId: string): Promise<Insight[]> {
  if (USE_MOCK) return insightsStore

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
  if (USE_MOCK) {
    const id = uuid()
    const createdAt = new Date().toISOString()
    const created: Insight = {
      id,
      userId: insight.userId,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      category: insight.category,
      createdAt,
      dismissed: false,
    }
    insightsStore = [created, ...insightsStore]
    return created
  }

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
  if (USE_MOCK) {
    const id = uuid()
    const createdAt = new Date().toISOString()
    const created: Goal = {
      id,
      userId: goal.userId,
      title: goal.title,
      description: goal.description,
      targetDays: goal.targetDays ?? 7,
      completedDays: 0,
      active: goal.active ?? true,
      createdAt,
    }
    goalsStore = [created, ...goalsStore]
    return created
  }

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
  if (USE_MOCK) return goalsStore

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

export async function updateGoalProgress(goalId: string, completedDays: number): Promise<void> {
  if (USE_MOCK) {
    goalsStore = goalsStore.map((g) =>
      g.id === goalId ? { ...g, completedDays } : g
    )
    return
  }

  const { error } = await supabase
    .from("goals")
    .update({ completed_days: completedDays })
    .eq("id", goalId)
  if (error) throw error
}

export async function addMessage(
  conversationId: string,
  role: Message["role"],
  content: string
): Promise<Message> {
  if (USE_MOCK) {
    const newMessage: Message = {
      id: uuid(),
      conversationId,
      role,
      content,
      timestamp: new Date().toISOString(),
    }
    conversationsStore = conversationsStore.map((c) => {
      if (c.id !== conversationId) return c
      const messages = [...c.messages, newMessage]
      return { ...c, messages, messageCount: messages.length }
    })
    return newMessage
  }

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
  summary: string,
  tags: string[],
  moodEmoji: string,
  title?: string
): Promise<void> {
  if (USE_MOCK) {
    conversationsStore = conversationsStore.map((c) =>
      c.id === conversationId
        ? { ...c, summary, tags, dominantEmoji: moodEmoji, title: title || c.title }
        : c
    )
    return
  }

  const { error } = await supabase
    .from("conversations")
    .update({
      summary,
      tags,
      mood_emoji: moodEmoji,
      title: title || summaryToTitle(summary),
    })
    .eq("id", conversationId)
  if (error) throw error
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  if (USE_MOCK) {
    conversationsStore = conversationsStore.map((c) =>
      c.id === conversationId ? { ...c, title } : c
    )
    return
  }

  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
  if (error) throw error
}

function summaryToTitle(summary: string): string {
  const cleaned = summary.trim()
  if (!cleaned) return "—"
  const firstSentence = cleaned.split(/[.!?]\s/)[0] || cleaned
  return firstSentence.slice(0, 60)
}
