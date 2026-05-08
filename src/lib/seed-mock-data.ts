import { supabaseServer as supabase } from "@/lib/supabase-server"
import type { GlucoseContext, InsulinType, MealType, MoodValue } from "@/lib/types"

type DayType = "good_day" | "normal_day" | "spike_day" | "hypo_day" | "sick_day" | "stress_day"
type BgSlotName = "fasting" | "post_breakfast" | "pre_lunch" | "post_lunch" | "afternoon" | "post_dinner" | "bedtime"

type EntryBaseRow = {
  id: string
  user_id: string
  source: "import"
  type: "glucose" | "meal" | "insulin" | "mood" | "activity"
  timestamp: string
  note: string | null
  conversation_id: string | null
}

type SeedResult = {
  seeded: boolean
  skippedReason?: "existing_entries"
  totalEntries: number
  dayTypeCounts: Record<DayType, number>
}

type BgSlot = {
  name: BgSlotName
  context: GlucoseContext
  hour: number
  minute: number
  min: number
  max: number
}

type MealTemplate = {
  description: string
  carbs: number
  mealType: MealType
  isSpikeMeal?: boolean
  isDelayedSpikeMeal?: boolean
}

type ActivityTemplate = {
  name: string
  minutes: number
  intensity: "low" | "medium" | "high"
  intense?: boolean
}

type MoodLog = {
  value: MoodValue
  note: string | null
  hour: number
  minute: number
}

const DAY_TYPE_TARGETS: Record<DayType, number> = {
  good_day: 53,
  normal_day: 74,
  spike_day: 32,
  hypo_day: 17,
  sick_day: 11,
  stress_day: 25,
}

const MONTH_BASELINE_SHIFT: Record<number, number> = {
  0: 10,
  1: 3,
  2: -7,
  3: 1,
  4: 8,
  5: -4,
  6: -1,
}

const BG_SLOTS: BgSlot[] = [
  { name: "fasting", context: "fasting", hour: 6, minute: 45, min: 95, max: 140 },
  { name: "post_breakfast", context: "post_meal", hour: 9, minute: 20, min: 160, max: 210 },
  { name: "pre_lunch", context: "pre_meal", hour: 12, minute: 0, min: 100, max: 140 },
  { name: "post_lunch", context: "post_meal", hour: 14, minute: 20, min: 140, max: 190 },
  { name: "afternoon", context: "other", hour: 16, minute: 20, min: 110, max: 150 },
  { name: "post_dinner", context: "post_meal", hour: 20, minute: 10, min: 130, max: 200 },
  { name: "bedtime", context: "bedtime", hour: 22, minute: 20, min: 100, max: 150 },
]

const BREAKFAST_POOL: MealTemplate[] = [
  { description: "Zwei Scheiben Vollkornbrot mit Käse", carbs: 40, mealType: "breakfast" },
  { description: "Müsli mit Milch und Banane", carbs: 65, mealType: "breakfast", isSpikeMeal: true },
  { description: "Rührei mit einer Scheibe Toast", carbs: 15, mealType: "breakfast" },
  { description: "Haferflocken mit Beeren", carbs: 45, mealType: "breakfast" },
  { description: "Croissant mit Marmelade", carbs: 55, mealType: "breakfast", isSpikeMeal: true },
  { description: "Naturjoghurt mit Nüssen", carbs: 12, mealType: "breakfast" },
  { description: "Brötchen mit Wurst und Gurke", carbs: 35, mealType: "breakfast" },
  { description: "Porridge mit Apfel und Zimt", carbs: 50, mealType: "breakfast" },
]

const LUNCH_POOL: MealTemplate[] = [
  { description: "Gemischter Salat mit Hähnchenbrust und Brot", carbs: 30, mealType: "lunch" },
  { description: "Spaghetti Bolognese", carbs: 75, mealType: "lunch", isSpikeMeal: true },
  { description: "Linsensuppe mit Vollkornbrot", carbs: 50, mealType: "lunch" },
  { description: "Döner im Fladenbrot", carbs: 60, mealType: "lunch" },
  { description: "Wrap mit Thunfisch und Salat", carbs: 35, mealType: "lunch" },
  { description: "Kartoffelsuppe mit Brot", carbs: 55, mealType: "lunch" },
  { description: "Bowl mit Reis, Gemüse und Tofu", carbs: 60, mealType: "lunch" },
  { description: "Schnitzel mit Kartoffelsalat", carbs: 45, mealType: "lunch" },
]

const DINNER_POOL: MealTemplate[] = [
  { description: "Lachs mit Reis und Gemüse", carbs: 50, mealType: "dinner" },
  { description: "Pizza Margherita", carbs: 80, mealType: "dinner", isSpikeMeal: true, isDelayedSpikeMeal: true },
  { description: "Steak mit Kartoffeln und Salat", carbs: 40, mealType: "dinner" },
  { description: "Asiatische Nudelpfanne", carbs: 70, mealType: "dinner", isSpikeMeal: true },
  { description: "Putenbrust mit Quinoa und Brokkoli", carbs: 35, mealType: "dinner" },
  { description: "Auflauf mit Gemüse und Käse", carbs: 30, mealType: "dinner" },
  { description: "Burger mit Pommes", carbs: 75, mealType: "dinner", isSpikeMeal: true, isDelayedSpikeMeal: true },
  { description: "Fisch mit Salzkartoffeln", carbs: 40, mealType: "dinner" },
]

const SNACK_POOL: MealTemplate[] = [
  { description: "Apfel", carbs: 20, mealType: "snack" },
  { description: "Müsliegel", carbs: 25, mealType: "snack" },
  { description: "Joghurt mit Honig", carbs: 30, mealType: "snack" },
  { description: "Handvoll Nüsse", carbs: 5, mealType: "snack" },
  { description: "Schokoriegel", carbs: 35, mealType: "snack", isSpikeMeal: true },
  { description: "Reiswaffel", carbs: 10, mealType: "snack" },
]

const ACTIVITY_POOL: ActivityTemplate[] = [
  { name: "Spaziergang", minutes: 30, intensity: "low" },
  { name: "Fahrrad fahren", minutes: 45, intensity: "medium" },
  { name: "Joggen", minutes: 25, intensity: "high", intense: true },
  { name: "Yoga/Stretching", minutes: 20, intensity: "low" },
  { name: "Schwimmen", minutes: 40, intensity: "medium", intense: true },
  { name: "Gartenarbeit", minutes: 60, intensity: "medium" },
  { name: "Wandern", minutes: 90, intensity: "high" },
]

const MOOD_NOTES: Record<DayType, string[]> = {
  hypo_day: [
    "Zittrig und gereizt nach Unterzucker",
    "Total erschöpft nach dem Hypo",
    "Konnte mich nicht konzentrieren nach der Unterzuckerung",
  ],
  good_day: [
    "Guter Tag, Werte waren stabil",
    "Endlich mal ein ruhiger Tag",
    "Freu mich, alles im Zielbereich",
  ],
  spike_day: [
    "Müde und frustriert, Werte gehen nicht runter",
    "Warum funktioniert das nie",
    "Hätte weniger Nudeln essen sollen",
  ],
  sick_day: ["Krank und Werte spielen verrückt", "Erkältet, alles ist anstrengend"],
  stress_day: ["Stress auf der Arbeit", "Schlecht geschlafen", "Streit mit Partner/in", "Einfach ein beschissener Tag"],
  normal_day: ["Ganz okay", "Normaler Tag", "Geht so"],
}

const MONTH_MOOD_SHIFT: Record<number, number> = {
  0: -0.2,
  1: -0.1,
  2: 0.6,
  3: 0.0,
  4: -0.7,
  5: 0.35,
  6: 0.4,
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashUserSeed(userId: string): number {
  let h = 2166136261
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(rng: () => number, values: T[]): T {
  return values[Math.floor(rng() * values.length)]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function jitter(rng: () => number, base: number, pct: number): number {
  const spread = base * pct
  return base + (rng() * 2 - 1) * spread
}

function toBerlinIso(date: Date, hour: number, minute: number): string {
  // Build a UTC guess, then shift so this wall-clock time matches Europe/Berlin.
  const utcGuess = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute, 0, 0))
  const berlinClock = new Date(utcGuess.toLocaleString("en-US", { timeZone: "Europe/Berlin" }))
  const utcClock = new Date(utcGuess.toLocaleString("en-US", { timeZone: "UTC" }))
  const offsetMs = utcClock.getTime() - berlinClock.getTime()
  return new Date(utcGuess.getTime() + offsetMs).toISOString()
}

function allStudyDates(): Date[] {
  const out: Date[] = []
  const start = new Date(Date.UTC(2026, 0, 1))
  const end = new Date(Date.UTC(2026, 6, 31))
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(new Date(d))
  }
  return out
}

function keyOf(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function monthlyWeight(month: number, type: DayType): number {
  const janSpikeBoost = month === 0 && type === "spike_day" ? 1.5 : 1
  const marGoodBoost = month === 2 && type === "good_day" ? 1.65 : 1
  const junGoodBoost = month === 5 && type === "good_day" ? 1.35 : 1
  const aprStressBoost = month === 3 && type === "stress_day" ? 1.35 : 1
  const mayStressSpikeBoost = month === 4 && (type === "stress_day" || type === "spike_day") ? 1.4 : 1
  const febSpikeDown = month === 1 && type === "spike_day" ? 0.85 : 1
  return janSpikeBoost * marGoodBoost * junGoodBoost * aprStressBoost * mayStressSpikeBoost * febSpikeDown
}

function addCluster(
  dates: Date[],
  assigned: Map<string, DayType>,
  remaining: Record<DayType, number>,
  type: DayType,
  startIdx: number,
  length: number
) {
  for (let i = startIdx; i < Math.min(startIdx + length, dates.length); i++) {
    if (remaining[type] <= 0) break
    const key = keyOf(dates[i])
    if (assigned.has(key)) continue
    assigned.set(key, type)
    remaining[type]--
  }
}

function buildDayTypePlan(rng: () => number, dates: Date[]): Map<string, DayType> {
  const assigned = new Map<string, DayType>()
  const remaining = { ...DAY_TYPE_TARGETS }

  // Fixed February flu streak (required narrative): Feb 10-12.
  const febFluStart = dates.findIndex((d) => d.getUTCMonth() === 1 && d.getUTCDate() === 10)
  if (febFluStart >= 0) addCluster(dates, assigned, remaining, "sick_day", febFluStart, 3)

  // Additional sick streaks (2-3 days each) for realistic illness clusters.
  while (remaining.sick_day > 0) {
    const monthCandidates = [1, 1, 3, 4, 6]
    const targetMonth = pick(rng, monthCandidates)
    const candidates = dates
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => d.getUTCMonth() === targetMonth && i < dates.length - 1)
      .filter(({ d }) => !assigned.has(keyOf(d)))

    if (candidates.length === 0) break
    const start = pick(rng, candidates)
    const len = remaining.sick_day >= 3 && rng() > 0.45 ? 3 : 2
    addCluster(dates, assigned, remaining, "sick_day", start.i, len)
  }

  // Stress clusters around pressure weeks (April/May heavy).
  const stressWindows: Array<{ month: number; from: number; to: number }> = [
    { month: 3, from: 6, to: 14 },
    { month: 4, from: 10, to: 20 },
    { month: 0, from: 19, to: 24 },
  ]
  for (const window of stressWindows) {
    if (remaining.stress_day <= 0) break
    const starts = dates
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d.getUTCMonth() === window.month && d.getUTCDate() >= window.from && d.getUTCDate() <= window.to)
      .filter(({ d }) => !assigned.has(keyOf(d)))
    if (starts.length === 0) continue
    const start = pick(rng, starts)
    const len = Math.min(remaining.stress_day, rng() > 0.5 ? 3 : 4)
    addCluster(dates, assigned, remaining, "stress_day", start.i, len)
  }

  let previous: DayType | null = null
  for (const d of dates) {
    const key = keyOf(d)
    if (assigned.has(key)) {
      previous = assigned.get(key) ?? null
      continue
    }

    const month = d.getUTCMonth()
    const types = (Object.keys(remaining) as DayType[]).filter((t) => remaining[t] > 0)
    if (types.length === 0) break

    let totalWeight = 0
    const weighted = types.map((t) => {
      const streakBoost = previous === t ? 1.2 : 1
      const scarcityBoost = 1 + remaining[t] / 120
      const w = monthlyWeight(month, t) * streakBoost * scarcityBoost
      totalWeight += w
      return { t, w }
    })

    let roll = rng() * totalWeight
    let chosen: DayType = weighted[weighted.length - 1].t
    for (const item of weighted) {
      roll -= item.w
      if (roll <= 0) {
        chosen = item.t
        break
      }
    }

    assigned.set(key, chosen)
    remaining[chosen]--
    previous = chosen
  }

  // Fill any rare remainder deterministically.
  for (const d of dates) {
    const key = keyOf(d)
    if (assigned.has(key)) continue
    const leftover = (Object.keys(remaining) as DayType[]).find((t) => remaining[t] > 0) ?? "normal_day"
    assigned.set(key, leftover)
    remaining[leftover] = Math.max(0, remaining[leftover] - 1)
  }

  return assigned
}

function monthReadingCountRange(month: number): { min: number; max: number } {
  if (month === 4) return { min: 3, max: 4 }
  return { min: 4, max: 7 }
}

function mkEntry(
  userId: string,
  type: EntryBaseRow["type"],
  timestamp: string,
  note: string | null,
  conversationId: string | null = null
): EntryBaseRow {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    source: "import",
    type,
    timestamp,
    note,
    conversation_id: conversationId,
  }
}

function chooseBgSlotIndices(rng: () => number, month: number, dayType: DayType): number[] {
  const range = monthReadingCountRange(month)
  const targetRaw = jitter(rng, (range.min + range.max) / 2, 0.22)
  const target = clamp(Math.round(targetRaw), range.min, range.max)
  const must = [0, 1, 5] // fasting, post-breakfast, post-dinner
  const optionalPriority = [2, 3, 4, 6]
  const picked = [...must]

  if (target >= 4) picked.push(2)
  if (target >= 5) picked.push(rng() > 0.5 ? 6 : 3)
  if (target >= 6) picked.push(rng() > 0.5 ? 3 : 4)
  if (target >= 7) picked.push(6)

  // good days are monitored more often.
  if (dayType === "good_day" && picked.length < 6 && month !== 4 && rng() > 0.45) {
    picked.push(4)
  }

  return [...new Set(picked)].sort((a, b) => a - b)
}

function pickActivityForDay(rng: () => number, day: Date): ActivityTemplate | null {
  const month = day.getUTCMonth()
  let chance = 0.5
  if (month === 2 || month === 5) chance = 0.68 // March + June
  if (month === 0 || month === 4) chance = 0.32 // January + May
  if (rng() > chance) return null

  const seasonalPool = ACTIVITY_POOL.filter((a) => {
    if (a.name === "Schwimmen") return month >= 5
    if (a.name === "Gartenarbeit") return month >= 3
    return true
  })

  return pick(rng, seasonalPool)
}

function forceDates(rng: () => number, dates: Date[], countMin: number, countMax: number, month?: number): Set<string> {
  const count = Math.floor(countMin + rng() * (countMax - countMin + 1))
  const pool = dates.filter((d) => (month == null ? true : d.getUTCMonth() === month)).map((d) => keyOf(d))
  const out = new Set<string>()
  while (out.size < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length)
    out.add(pool[idx])
    pool.splice(idx, 1)
  }
  return out
}

function bgClampByDayType(value: number, dayType: DayType): number {
  if (dayType === "good_day") return clamp(value, 80, 155)
  if (dayType === "sick_day") return clamp(value, 155, 280)
  return clamp(value, 55, 280)
}

function pickMoodCount(rng: () => number, month: number): number {
  if (month === 4) return rng() < 0.65 ? 0 : 1
  return rng() < 0.58 ? 1 : 2
}

function clampMood(v: number): MoodValue {
  return clamp(Math.round(v), 1, 5) as MoodValue
}

function moodRangeByDayType(dayType: DayType): [MoodValue, MoodValue] {
  if (dayType === "good_day") return [4, 5]
  if (dayType === "normal_day") return [3, 4]
  if (dayType === "spike_day") return [2, 3]
  if (dayType === "hypo_day") return [1, 2]
  if (dayType === "sick_day") return [1, 2]
  return [1, 3]
}

function buildMoodLogs(rng: () => number, dayType: DayType, month: number): MoodLog[] {
  const count = pickMoodCount(rng, month)
  if (count === 0) return []

  const [minMood, maxMood] = moodRangeByDayType(dayType)
  const notes = MOOD_NOTES[dayType]
  const logs: MoodLog[] = []

  for (let i = 0; i < count; i++) {
    const raw = minMood + rng() * (maxMood - minMood) + MONTH_MOOD_SHIFT[month]
    const value = clampMood(raw)
    const shouldAddNote = dayType !== "normal_day" || value <= 2 || rng() < 0.5
    logs.push({
      value,
      note: shouldAddNote ? pick(rng, notes) : null,
      hour: i === 0 ? 13 : 21,
      minute: i === 0 ? 15 + Math.round(rng() * 30) : 10 + Math.round(rng() * 35),
    })
  }

  if (logs.length === 2 && (dayType === "hypo_day" || dayType === "sick_day" || (month === 4 && dayType !== "good_day"))) {
    logs[1].value = clampMood(Math.min(logs[0].value, logs[1].value))
  }

  return logs
}

function generateBgValues(params: {
  rng: () => number
  dayType: DayType
  month: number
  chosenSlots: number[]
  mealMeta: { breakfast: MealTemplate; lunch: MealTemplate; dinner: MealTemplate }
  hasMissingBolus: boolean
  hasSkippedBasalYesterday: boolean
  activity: ActivityTemplate | null
}): Map<BgSlotName, number> {
  const { rng, dayType, month, chosenSlots, mealMeta, hasMissingBolus, hasSkippedBasalYesterday, activity } = params
  const out = new Map<BgSlotName, number>()
  const hasDawn = rng() < 0.4
  const baselineShift = MONTH_BASELINE_SHIFT[month]
  const exerciseDrop = activity ? 15 + Math.round(rng() * 15) : 0

  let hypoSlot: BgSlotName | null = null
  if (dayType === "hypo_day") {
    hypoSlot = rng() > 0.45 ? "afternoon" : "pre_lunch"
  }

  for (const idx of chosenSlots) {
    const slot = BG_SLOTS[idx]
    let min = slot.min + baselineShift
    let max = slot.max + baselineShift

    if (slot.name === "fasting" && hasDawn) {
      min = Math.max(min, 130)
      max = Math.max(max, 155)
    }

    if (slot.name === "fasting" && hasSkippedBasalYesterday) {
      min = Math.max(min, 160)
      max = Math.max(max, 190)
    }

    if (slot.name === "post_breakfast" && mealMeta.breakfast.isSpikeMeal) {
      min += 16
      max += 32
    }
    if (slot.name === "post_lunch" && mealMeta.lunch.isSpikeMeal) {
      min += 12
      max += 26
    }
    if (slot.name === "post_dinner" && mealMeta.dinner.isDelayedSpikeMeal) {
      min = Math.max(min, 190)
      max = Math.max(max, 260)
    }

    if (dayType === "good_day") {
      min = Math.max(80, min - 12)
      max = Math.min(155, max - 18)
    } else if (dayType === "spike_day") {
      if (slot.name === "post_breakfast" || slot.name === "post_dinner") {
        min = Math.max(min, 200)
        max = Math.max(max, 260)
      }
    } else if (dayType === "sick_day") {
      min = Math.max(155, min + 15)
      max = Math.max(min + 18, max + 26)
    } else if (dayType === "stress_day") {
      min += Math.round((rng() * 2 - 1) * 26)
      max += Math.round((rng() * 2 - 1) * 40)
      if (rng() > 0.55) {
        min -= 20
        max += 25
      }
    }

    if (hypoSlot === slot.name) {
      min = 55
      max = 75
    }

    let value = Math.round(min + rng() * Math.max(1, max - min))
    value = bgClampByDayType(value, dayType)
    out.set(slot.name, value)
  }

  // Hypo rebound (next measured reading after hypo).
  if (hypoSlot) {
    const order: BgSlotName[] = ["fasting", "post_breakfast", "pre_lunch", "post_lunch", "afternoon", "post_dinner", "bedtime"]
    const start = order.indexOf(hypoSlot)
    for (let i = start + 1; i < order.length; i++) {
      const n = order[i]
      if (!out.has(n)) continue
      const rebound = Math.round(140 + rng() * 40)
      out.set(n, rebound)
      break
    }
  }

  // Forced missing-bolus spikes (4-6 days over the whole period).
  if (hasMissingBolus) {
    const spikeSlot = rng() > 0.5 ? "post_breakfast" : "post_dinner"
    if (out.has(spikeSlot)) {
      out.set(spikeSlot, Math.round(220 + rng() * 40))
    }
  }

  // Exercise lowers afternoon/evening values.
  if (activity) {
    const affected: BgSlotName[] = ["afternoon", "post_dinner", "bedtime"]
    for (const name of affected) {
      if (!out.has(name)) continue
      const drop = exerciseDrop + (activity.intense ? 6 : 0)
      out.set(name, bgClampByDayType((out.get(name) ?? 120) - drop, dayType))
    }
  }

  if (dayType === "spike_day") {
    const hasSpike = [...out.values()].some((v) => v >= 200)
    if (!hasSpike) {
      if (out.has("post_breakfast")) out.set("post_breakfast", 210 + Math.round(rng() * 28))
      else if (out.has("post_dinner")) out.set("post_dinner", 210 + Math.round(rng() * 28))
    }
  }

  if (dayType === "sick_day") {
    for (const [name, v] of out.entries()) {
      out.set(name, Math.max(155, v))
    }
  }

  if (dayType === "good_day") {
    for (const [name, v] of out.entries()) {
      out.set(name, Math.min(155, Math.max(80, v)))
    }
  }

  return out
}

function createDayEntries(
  userId: string,
  day: Date,
  dayType: DayType,
  rng: () => number,
  controls: {
    missingBolusDates: Set<string>
    skippedBasalDates: Set<string>
    skippedBasalYesterday: Set<string>
  },
  out: {
    entries: EntryBaseRow[]
    glucose: Array<{ entry_id: string; value: number; context: GlucoseContext }>
    insulin: Array<{ entry_id: string; dose: number; insulin_type: InsulinType; insulin_name: string | null }>
    meals: Array<{ entry_id: string; description: string; carbs_grams: number | null; meal_type: MealType; linked_insulin_id: string | null }>
    mood: Array<{ entry_id: string; mood_value: MoodValue }>
    activity: Array<{ entry_id: string; activity_type: string; duration_minutes: number | null; intensity: "low" | "medium" | "high" }>
  }
) {
  const month = day.getUTCMonth()
  const key = keyOf(day)
  const hasMissingBolus = controls.missingBolusDates.has(key)
  const skipBasalToday = controls.skippedBasalDates.has(key)
  const skippedBasalYesterday = controls.skippedBasalYesterday.has(key)
  const chosenSlots = chooseBgSlotIndices(rng, month, dayType)

  const breakfast = pick(rng, BREAKFAST_POOL)
  const lunch = pick(rng, LUNCH_POOL)
  const dinner = pick(rng, DINNER_POOL)
  const addSnack = dayType === "hypo_day" ? true : rng() < 0.6
  const snack = addSnack
    ? dayType === "hypo_day"
      ? ({ description: "Traubenzucker", carbs: 15, mealType: "snack" } as MealTemplate)
      : pick(rng, SNACK_POOL)
    : null

  const activity = pickActivityForDay(rng, day)

  const bgValues = generateBgValues({
    rng,
    dayType,
    month,
    chosenSlots,
    mealMeta: { breakfast, lunch, dinner },
    hasMissingBolus,
    hasSkippedBasalYesterday: skippedBasalYesterday,
    activity,
  })

  for (const idx of chosenSlots) {
    const slot = BG_SLOTS[idx]
    const ts = toBerlinIso(day, slot.hour, slot.minute + Math.round((rng() * 2 - 1) * 22))
    const entry = mkEntry(userId, "glucose", ts, null)
    out.entries.push(entry)
    out.glucose.push({
      entry_id: entry.id,
      value: bgValues.get(slot.name) ?? Math.round((slot.min + slot.max) / 2),
      context: slot.context,
    })
  }

  const mealRows: Array<{ template: MealTemplate; hour: number; minute: number }> = [
    { template: breakfast, hour: 7, minute: 30 },
    { template: lunch, hour: 12, minute: 30 },
    { template: dinner, hour: 19, minute: 5 },
  ]
  if (snack) mealRows.push({ template: snack, hour: 15, minute: 45 })

  const hypoOverdoseTarget =
    dayType === "hypo_day"
      ? mealRows.find((m) => m.template.mealType === "lunch" && m.template.carbs <= 40) ??
        mealRows.find((m) => m.template.mealType === "lunch")
      : null

  for (const meal of mealRows) {
    const mealTs = toBerlinIso(day, meal.hour, meal.minute + Math.round((rng() * 2 - 1) * 20))
    const mealEntry = mkEntry(userId, "meal", mealTs, null)
    out.entries.push(mealEntry)
    out.meals.push({
      entry_id: mealEntry.id,
      description: meal.template.description,
      carbs_grams: meal.template.carbs,
      meal_type: meal.template.mealType,
      linked_insulin_id: null,
    })

    // Traubenzucker is a treatment snack, no bolus.
    if (meal.template.description === "Traubenzucker") continue

    const isMissingBolusMeal =
      hasMissingBolus &&
      ((meal.template.mealType === "breakfast" && rng() > 0.5) || meal.template.mealType === "dinner")
    if (isMissingBolusMeal) {
      const correctionTs = toBerlinIso(day, meal.hour + 2, meal.minute + Math.round((rng() * 2 - 1) * 12))
      const correctionEntry = mkEntry(userId, "insulin", correctionTs, "Späte Korrektur nach verpasstem Bolus")
      out.entries.push(correctionEntry)
      out.insulin.push({
        entry_id: correctionEntry.id,
        dose: 3 + Math.round(rng() * 2),
        insulin_type: "rapid",
        insulin_name: "NovoRapid",
      })
      continue
    }

    let dose = meal.template.carbs / 10
    if (meal.template.mealType === "breakfast") dose += 1.2
    if (meal.template.mealType === "dinner") dose += 0.6

    const preMealBg =
      meal.template.mealType === "breakfast"
        ? bgValues.get("fasting")
        : meal.template.mealType === "lunch"
          ? bgValues.get("pre_lunch")
          : bgValues.get("afternoon")
    if ((preMealBg ?? 120) > 180) {
      dose += 1 + Math.round(rng() * 2)
    }

    if (meal.template.isDelayedSpikeMeal) {
      dose += 1.1
    }

    if (hypoOverdoseTarget && meal.template.mealType === hypoOverdoseTarget.template.mealType) {
      dose = 7 + rng() * 2
    }

    if (meal.template.mealType === "breakfast") dose = clamp(dose, 4, 8.5)
    if (meal.template.mealType === "lunch") dose = clamp(dose, 3, 6.5)
    if (meal.template.mealType === "dinner") dose = clamp(dose, 4, 10)

    const insulinTs = toBerlinIso(day, meal.hour, meal.minute - 12 + Math.round((rng() * 2 - 1) * 8))
    const insulinEntry = mkEntry(userId, "insulin", insulinTs, null)
    out.entries.push(insulinEntry)
    out.insulin.push({
      entry_id: insulinEntry.id,
      dose: Math.round(dose * 10) / 10,
      insulin_type: "rapid",
      insulin_name: "NovoRapid",
    })
    out.meals[out.meals.length - 1].linked_insulin_id = insulinEntry.id
  }

  if (!skipBasalToday) {
    const basalTs = toBerlinIso(day, 22, 10 + Math.round((rng() * 2 - 1) * 25))
    const basalEntry = mkEntry(userId, "insulin", basalTs, null)
    out.entries.push(basalEntry)
    out.insulin.push({
      entry_id: basalEntry.id,
      dose: 18 + Math.round(rng() * 4),
      insulin_type: "long_acting",
      insulin_name: "Lantus",
    })
  }

  if (activity) {
    const activityTs = toBerlinIso(day, 17, 30 + Math.round((rng() * 2 - 1) * 25))
    const activityEntry = mkEntry(userId, "activity", activityTs, null)
    out.entries.push(activityEntry)
    out.activity.push({
      entry_id: activityEntry.id,
      activity_type: activity.name,
      duration_minutes: activity.minutes,
      intensity: activity.intensity,
    })
  }

  const moodLogs = buildMoodLogs(rng, dayType, month)
  for (const mood of moodLogs) {
    const moodTs = toBerlinIso(day, mood.hour, mood.minute)
    const moodEntry = mkEntry(userId, "mood", moodTs, mood.note)
    out.entries.push(moodEntry)
    out.mood.push({ entry_id: moodEntry.id, mood_value: mood.value })
  }
}

async function insertChunked<T extends Record<string, unknown>>(table: string, rows: T[], chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    if (chunk.length === 0) continue
    const { error } = await supabase.from(table).insert(chunk)
    if (error) throw error
  }
}

async function seedMayBuddyConversation(userId: string) {
  const conversationId = crypto.randomUUID()
  const day = new Date(Date.UTC(2026, 4, 15))
  const started = toBerlinIso(day, 20, 30)
  const ended = toBerlinIso(day, 20, 50)

  const { error: convError } = await supabase.from("conversations").insert({
    id: conversationId,
    user_id: userId,
    title: "Erschöpfung und Diabetes-Frust",
    summary:
      "Das Gespräch zeigt Anzeichen von Diabetes-Burnout: Erschöpfung, Frustration über schwankende Werte und nachlassende Motivation beim Selbstmanagement. Positiv: Der Nutzer hat soziale Unterstützung (Hund als Ressource) und ist offen für professionelle Hilfe (Diabetologin). Der Somogyi-Effekt wurde als Erklärung für den hohen Nüchternwert nach einer Hypo besprochen. Empfehlung: Vereinfachung der Routine, realistische Ziele setzen, Termin bei Diabetologin zum Thema Burnout.",
    mood_emoji: "😟",
    tags: [
      { emoji: "😟", label: "Burnout" },
      { emoji: "🩺", label: "Diabetologin" },
    ],
    emotions: {
      happiness: 0.1,
      surprise: 0.08,
      sadness: 0.64,
      anger: 0.32,
      fear: 0.48,
      disgust: 0.14,
    },
    is_active: false,
    started_at: started,
    ended_at: ended,
  })
  if (convError) throw convError

  const msgs = [
    {
      role: "assistant",
      content:
        "Hey! Schön, dass du da bist. Wie geht es dir heute? Ich hab gesehen, dass deine Werte in den letzten Tagen etwas Achterbahn gefahren sind — magst du mir erzählen, wie es dir damit geht?",
      timestamp: toBerlinIso(day, 20, 30),
    },
    {
      role: "user",
      content:
        "Ehrlich gesagt bin ich einfach nur müde. Ich hab das Gefühl, egal was ich mache, die Werte machen was sie wollen. Gestern Abend hatte ich ne Unterzuckerung und heute Morgen war ich trotzdem bei 165. Ich versteh das nicht mehr.",
      timestamp: toBerlinIso(day, 20, 33),
    },
    {
      role: "assistant",
      content:
        "Das klingt wirklich frustrierend — und ich kann total verstehen, dass dich das fertig macht. Dieses Gefühl, alles richtig zu machen und trotzdem besch***ene Werte zu haben, das kennen unglaublich viele Menschen mit Diabetes. Das ist kein Versagen von dir.\nDie Kombi aus Hypo am Abend und hohem Nüchternwert danach ist übrigens ein bekanntes Phänomen — der Körper schüttet nach einer Unterzuckerung Stresshormone aus, die den Blutzucker hochjagen. Das nennt sich Somogyi-Effekt. Dein Körper hat also eigentlich genau das Richtige getan.\nWie lange hast du das Gefühl schon, dass alles zu viel wird?",
      timestamp: toBerlinIso(day, 20, 36),
    },
    {
      role: "user",
      content:
        "Seit ein paar Wochen. Ich hab manchmal einfach keine Lust mehr zu messen. Oder zu spritzen. Ich weiß, dass das dumm ist, aber ich bin einfach durch.",
      timestamp: toBerlinIso(day, 20, 39),
    },
    {
      role: "assistant",
      content:
        "Das ist nicht dumm. Das ist Diabetes-Burnout, und das ist so real wie der Diabetes selbst. Ungefähr jeder vierte Mensch mit Diabetes erlebt das irgendwann. Die ständige Last — messen, rechnen, spritzen, essen planen, Angst vor Hypos, Angst vor Spätfolgen — das ist einfach verdammt viel. Jeden. Einzelnen. Tag.\n\nDass du das gerade so empfindest, zeigt nicht, dass du schwach bist. Es zeigt, dass du schon sehr lange sehr viel trägst.\nWas mich interessiert: Gibt es gerade irgendwas, das dir trotzdem noch gut tut? Irgendeine kleine Sache am Tag?",
      timestamp: toBerlinIso(day, 20, 42),
    },
    {
      role: "user",
      content: "Mein Hund. Wenn ich mit dem rausgehe, denk ich wenigstens nicht an den ganzen Mist.",
      timestamp: toBerlinIso(day, 20, 44),
    },
    {
      role: "assistant",
      content:
        "Das ist doch was. Dein Hund und du, draußen — das ist Bewegung, frische Luft, Ablenkung und Verbindung, alles gleichzeitig. Und weißt du was? Die Spaziergänge helfen auch deinem Blutzucker. Nicht als Pflichtprogramm, sondern einfach als netter Nebeneffekt von etwas, das dir gut tut.\nIch will dir keinen Vortrag halten. Aber ein Gedanke für die nächsten Tage: Du musst nicht alles perfekt machen. Wenn du gerade nicht 6 Mal am Tag messen kannst, dann mess 3 Mal. Wenn du den Nüchternwert und den Abendbrot-Wert hast, ist das schon eine ganze Menge. Diabetes-Management ist kein Alles-oder-Nichts.\nUnd wenn das Gefühl der Erschöpfung anhält: Hast du jemanden — Arzt, Diabetesberaterin, Freund — mit dem du darüber reden kannst? Du musst das nicht allein durchziehen.",
      timestamp: toBerlinIso(day, 20, 47),
    },
    {
      role: "user",
      content: "Meine Diabetologin ist ganz okay. Vielleicht rede ich beim nächsten Termin mal mit ihr darüber.",
      timestamp: toBerlinIso(day, 20, 49),
    },
    {
      role: "assistant",
      content:
        "Das wäre ein richtig guter Schritt. Diabetologinnen kennen das Thema Burnout, und manchmal hilft es einfach, wenn jemand sagt: 'Das ist normal und wir finden einen Weg.'\nDu hast heute etwas Wichtiges gemacht — du hast ausgesprochen, dass es dir nicht gut geht. Das ist der erste Schritt. Ich bin hier, wann immer du reden willst. Keine Erwartungen, kein Druck.\nPass auf dich auf. Und grüß deinen Hund von mir.",
      timestamp: toBerlinIso(day, 20, 50),
    },
  ]

  const { error: msgError } = await supabase.from("messages").insert(
    msgs.map((m) => ({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))
  )
  if (msgError) throw msgError
}

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
    return {
      seeded: false,
      skippedReason: "existing_entries",
      totalEntries: 0,
      dayTypeCounts: { ...DAY_TYPE_TARGETS, good_day: 0, normal_day: 0, spike_day: 0, hypo_day: 0, sick_day: 0, stress_day: 0 },
    }
  }

  const rng = mulberry32(hashUserSeed(userId))
  const dates = allStudyDates()
  const plan = buildDayTypePlan(rng, dates)
  const missingBolusDates = forceDates(rng, dates, 4, 6)
  const skippedBasalDates = forceDates(rng, dates, 2, 3, 4)
  const skippedBasalYesterday = new Set<string>()
  for (const date of dates) {
    const prev = new Date(date)
    prev.setUTCDate(prev.getUTCDate() - 1)
    if (skippedBasalDates.has(keyOf(prev))) {
      skippedBasalYesterday.add(keyOf(date))
    }
  }

  const dayTypeCounts: Record<DayType, number> = {
    good_day: 0,
    normal_day: 0,
    spike_day: 0,
    hypo_day: 0,
    sick_day: 0,
    stress_day: 0,
  }

  const bucket = {
    entries: [] as EntryBaseRow[],
    glucose: [] as Array<{ entry_id: string; value: number; context: GlucoseContext }>,
    insulin: [] as Array<{ entry_id: string; dose: number; insulin_type: InsulinType; insulin_name: string | null }>,
    meals: [] as Array<{ entry_id: string; description: string; carbs_grams: number | null; meal_type: MealType; linked_insulin_id: string | null }>,
    mood: [] as Array<{ entry_id: string; mood_value: MoodValue }>,
    activity: [] as Array<{ entry_id: string; activity_type: string; duration_minutes: number | null; intensity: "low" | "medium" | "high" }>,
  }

  for (const date of dates) {
    const dayType = plan.get(keyOf(date)) ?? "normal_day"
    dayTypeCounts[dayType] += 1
    createDayEntries(
      userId,
      date,
      dayType,
      rng,
      { missingBolusDates, skippedBasalDates, skippedBasalYesterday },
      bucket
    )
  }

  bucket.entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  await insertChunked("entries", bucket.entries)
  await Promise.all([
    insertChunked("entry_glucose", bucket.glucose),
    insertChunked("entry_insulin", bucket.insulin),
    insertChunked("entry_meal", bucket.meals),
    insertChunked("entry_mood", bucket.mood),
    insertChunked("entry_activity", bucket.activity),
  ])

  // One seeded conversation in May to anchor the burnout/recovery narrative.
  await seedMayBuddyConversation(userId)

  return {
    seeded: true,
    totalEntries: bucket.entries.length,
    dayTypeCounts,
  }
}

export async function reseedMockDataForUser(userId: string): Promise<SeedResult> {
  await supabase.from("entries").delete().eq("user_id", userId)
  await supabase.from("conversations").delete().eq("user_id", userId)
  return seedMockDataForUser(userId, { force: true })
}
