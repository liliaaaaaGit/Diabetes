/**
 * Pure, dependency-free generator for a realistic 3-month Type-1 diabetes dataset
 * (May 1 – Aug 1, 2026). "Pure" means it does NOT touch the database or import the
 * Supabase client — it only builds plain row objects. That keeps it fast,
 * deterministic (seeded by userId), and testable in isolation.
 *
 * The companion file `seed-mock-data.ts` takes the output of `generateSeedData`
 * and bulk-inserts it.
 *
 * IMPORTANT schema note:
 * The DB CHECK constraints only allow entries.source ∈ {manual,conversation,import}
 * and entry_glucose.context ∈ {fasting,pre_meal,post_meal,bedtime,other}. The CGM
 * spec asks for source='cgm'/context='CGM', which the DB would reject. We therefore
 * store CGM readings as source='import' with realistic clinical context tags. This
 * is functionally identical for the app (no CGM-specific rendering exists).
 */

import type {
  ConversationEmotions,
  ConversationTag,
  GlucoseContext,
  InsulinEntryType,
  InsulinType,
  MealType,
  MoodValue,
} from "@/lib/types"

// ---------------------------------------------------------------------------
// Row shapes (match DB columns exactly)
// ---------------------------------------------------------------------------

export type EntryRow = {
  id: string
  user_id: string
  source: "manual" | "import"
  type: "glucose" | "insulin" | "meal" | "activity" | "mood"
  timestamp: string
  note: string | null
  conversation_id: string | null
}

export type GlucoseRow = { entry_id: string; value: number; context: GlucoseContext }
export type InsulinRow = {
  entry_id: string
  dose: number
  insulin_type: InsulinType
  insulin_entry_type: InsulinEntryType
  insulin_name: string | null
}
export type MealRow = {
  entry_id: string
  description: string
  carbs_grams: number | null
  meal_type: MealType
  linked_insulin_id: string | null
  source: "manual"
}
export type MoodRow = { entry_id: string; mood_value: MoodValue }
export type ActivityRow = {
  entry_id: string
  activity_type: string
  duration_minutes: number | null
  intensity: "low" | "medium" | "high"
}

export type ConversationRow = {
  id: string
  user_id: string
  title: string
  summary: string
  mood_emoji: string
  tags: ConversationTag[]
  emotions: ConversationEmotions
  is_active: boolean
  started_at: string
  ended_at: string
}
export type MessageRow = {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}
export type InsightRow = {
  user_id: string
  type: "pattern" | "stat" | "theme" | "goal" | "motivation"
  title: string
  description: string
  category: string | null
  dismissed: boolean
}
export type GoalRow = {
  user_id: string
  title: string
  description: string
  target_days: number
  completed_days: number
  active: boolean
}

export type SeedData = {
  entries: EntryRow[]
  glucose: GlucoseRow[]
  insulin: InsulinRow[]
  meals: MealRow[]
  mood: MoodRow[]
  activity: ActivityRow[]
  conversations: ConversationRow[]
  messages: MessageRow[]
  insights: InsightRow[]
  goals: GoalRow[]
  stats: {
    days: number
    totalEntries: number
    cgmReadings: number
    meals: number
    insulin: number
    moods: number
    activities: number
    hypoEvents: number
    conversations: number
  }
}

// ---------------------------------------------------------------------------
// Deterministic RNG (seeded by userId so the same user always gets same data)
// ---------------------------------------------------------------------------

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

type Rng = () => number

function pick<T>(rng: Rng, values: T[]): T {
  return values[Math.floor(rng() * values.length)]
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
/** Random float in [min, max). */
function rand(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}
/** Random integer in [min, max] inclusive. */
function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rand(rng, min, max + 1))
}
/** Rough gaussian via averaging (central limit) — for natural-looking drift. */
function gauss(rng: Rng): number {
  return (rng() + rng() + rng() - 1.5) / 1.5 // ~mean 0, range ~[-1,1]
}

// ---------------------------------------------------------------------------
// Time helpers (everything anchored to Europe/Berlin wall-clock)
// ---------------------------------------------------------------------------

function toBerlinIso(date: Date, minutesOfDay: number): string {
  const hour = Math.floor(minutesOfDay / 60)
  const minute = minutesOfDay % 60
  const utcGuess = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, Math.floor(minute), Math.round((minute % 1) * 60), 0)
  )
  const berlinClock = new Date(utcGuess.toLocaleString("en-US", { timeZone: "Europe/Berlin" }))
  const utcClock = new Date(utcGuess.toLocaleString("en-US", { timeZone: "UTC" }))
  const offsetMs = utcClock.getTime() - berlinClock.getTime()
  return new Date(utcGuess.getTime() + offsetMs).toISOString()
}

/** Study days: May 1, 2026 up to "today" (Europe/Berlin), max Aug 1, 2026. */
function studyDates(): Date[] {
  const out: Date[] = []
  const start = new Date(Date.UTC(2026, 4, 1)) // May 1
  const maxEnd = new Date(Date.UTC(2026, 7, 1)) // Aug 1
  const berlinTodayIso = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })
  const berlinToday = new Date(`${berlinTodayIso}T00:00:00.000Z`)
  const end = berlinToday < maxEnd ? berlinToday : maxEnd
  if (end < start) return out
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(new Date(d))
  }
  return out
}

function keyOf(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function isWeekend(d: Date): boolean {
  const day = d.getUTCDay()
  return day === 0 || day === 6
}

// ---------------------------------------------------------------------------
// Monthly narrative (May = stress, June = burnout → recovery, July = stable)
// We interpolate a control "rest level" (the baseline BG the day hovers around)
// and a mood target across keyframes by absolute day index (0..92).
// ---------------------------------------------------------------------------

type Keyframe = { day: number; rest: number; mood: number }
const NARRATIVE: Keyframe[] = [
  { day: 0, rest: 150, mood: 3.4 }, // May 1
  { day: 30, rest: 160, mood: 3.2 }, // May 31 (semester stress)
  { day: 38, rest: 176, mood: 2.9 }, // ~Jun 8 (burnout)
  { day: 44, rest: 178, mood: 2.7 }, // ~Jun 14 (cold + burnout low)
  { day: 55, rest: 156, mood: 3.4 }, // ~Jun 25 (turning point, Diabetologin)
  { day: 61, rest: 144, mood: 3.7 }, // Jul 1
  { day: 75, rest: 137, mood: 3.9 }, // Jul 15
  { day: 92, rest: 130, mood: 4.1 }, // Aug 1
]

function interpNarrative(dayIndex: number): { rest: number; mood: number } {
  for (let i = 0; i < NARRATIVE.length - 1; i++) {
    const a = NARRATIVE[i]
    const b = NARRATIVE[i + 1]
    if (dayIndex >= a.day && dayIndex <= b.day) {
      const x = (dayIndex - a.day) / (b.day - a.day)
      return { rest: a.rest + (b.rest - a.rest) * x, mood: a.mood + (b.mood - a.mood) * x }
    }
  }
  const last = NARRATIVE[NARRATIVE.length - 1]
  return { rest: last.rest, mood: last.mood }
}

// ---------------------------------------------------------------------------
// Food / activity / mood pools
// ---------------------------------------------------------------------------

type Gi = "high" | "med" | "low"
type Meal = { description: string; carbs: number; gi: Gi; mealType: MealType }

const BREAKFAST: Meal[] = [
  { description: "Müsli mit Milch und Banane", carbs: 55, gi: "high", mealType: "breakfast" },
  { description: "2 Scheiben Vollkornbrot mit Käse", carbs: 35, gi: "low", mealType: "breakfast" },
  { description: "Joghurt mit Beeren und Haferflocken", carbs: 40, gi: "med", mealType: "breakfast" },
  { description: "Brötchen mit Marmelade und Butter", carbs: 50, gi: "high", mealType: "breakfast" },
  { description: "Rührei mit Toast", carbs: 25, gi: "low", mealType: "breakfast" },
  { description: "Porridge mit Apfel", carbs: 45, gi: "med", mealType: "breakfast" },
  { description: "Croissant und Orangensaft", carbs: 60, gi: "high", mealType: "breakfast" },
  { description: "Quark mit Honig", carbs: 20, gi: "low", mealType: "breakfast" },
]

const LUNCH: Meal[] = [
  { description: "Pasta Bolognese", carbs: 70, gi: "high", mealType: "lunch" },
  { description: "Reis mit Hähnchen und Gemüse", carbs: 60, gi: "med", mealType: "lunch" },
  { description: "Wrap mit Falafel und Hummus", carbs: 55, gi: "med", mealType: "lunch" },
  { description: "Kartoffelsuppe mit Brot", carbs: 50, gi: "med", mealType: "lunch" },
  { description: "Salat mit Baguette", carbs: 35, gi: "med", mealType: "lunch" },
  { description: "Pizza Margherita (2 Stücke)", carbs: 65, gi: "high", mealType: "lunch" },
  { description: "Schnitzel mit Pommes", carbs: 75, gi: "high", mealType: "lunch" },
  { description: "Sushi (12 Stück)", carbs: 55, gi: "med", mealType: "lunch" },
  { description: "Döner im Fladenbrot", carbs: 50, gi: "med", mealType: "lunch" },
]

const DINNER: Meal[] = [
  { description: "Brot mit Aufschnitt und Gurke", carbs: 40, gi: "med", mealType: "dinner" },
  { description: "Ofenkartoffel mit Quark", carbs: 45, gi: "med", mealType: "dinner" },
  { description: "Risotto mit Pilzen", carbs: 60, gi: "high", mealType: "dinner" },
  { description: "Suppe mit Brot", carbs: 35, gi: "med", mealType: "dinner" },
  { description: "Griechischer Salat mit Feta, kein Brot", carbs: 8, gi: "low", mealType: "dinner" },
  { description: "Fischstäbchen mit Kartoffelpüree", carbs: 50, gi: "med", mealType: "dinner" },
  { description: "Flammkuchen", carbs: 40, gi: "med", mealType: "dinner" },
]

const SNACKS: Meal[] = [
  { description: "Apfel", carbs: 15, gi: "med", mealType: "snack" },
  { description: "Banane", carbs: 25, gi: "high", mealType: "snack" },
  { description: "Müsliriegel", carbs: 20, gi: "med", mealType: "snack" },
  { description: "Schokolade (3 Stücke)", carbs: 15, gi: "high", mealType: "snack" },
  { description: "Kekse", carbs: 20, gi: "high", mealType: "snack" },
  { description: "Nüsse", carbs: 3, gi: "low", mealType: "snack" },
  { description: "Käsewürfel", carbs: 1, gi: "low", mealType: "snack" },
  { description: "Smoothie", carbs: 30, gi: "high", mealType: "snack" },
  { description: "Latte Macchiato", carbs: 10, gi: "low", mealType: "snack" },
]

// Restaurant meals: carbs are guessed (and under-estimated), so a bigger spike.
const RESTAURANT: Meal[] = [
  { description: "Pizza beim Italiener, KH geschätzt", carbs: 70, gi: "high", mealType: "dinner" },
  { description: "Asia-Buffet, KH geschätzt", carbs: 80, gi: "high", mealType: "dinner" },
  { description: "Burger und Pommes auswärts, KH geschätzt", carbs: 75, gi: "high", mealType: "dinner" },
  { description: "Pasta im Restaurant, KH geschätzt", carbs: 85, gi: "high", mealType: "dinner" },
]

type Activity = { name: string; min: number; max: number; intensity: "low" | "medium" | "high" }
const ACTIVITIES: Activity[] = [
  { name: "Spaziergang", min: 20, max: 45, intensity: "low" },
  { name: "Joggen", min: 25, max: 40, intensity: "medium" },
  { name: "Radfahren", min: 30, max: 60, intensity: "medium" },
  { name: "Yoga", min: 30, max: 45, intensity: "low" },
  { name: "Krafttraining", min: 40, max: 60, intensity: "high" },
  { name: "Schwimmen", min: 30, max: 45, intensity: "medium" },
  { name: "Hausarbeit", min: 30, max: 60, intensity: "low" },
  { name: "Fahrrad zur Arbeit", min: 15, max: 25, intensity: "medium" },
]

const MOOD_TEXTS: Record<MoodValue, string[]> = {
  5: [
    "Richtig guter Tag heute",
    "Fühle mich super, Werte waren top",
    "Endlich mal ein Tag ohne Achterbahn",
    "Gut geschlafen, gute Laune",
    "Sport hat gutgetan, bin happy",
  ],
  4: [
    "Ganz okay heute",
    "Läuft soweit",
    "Guter Tag, nur ein kleiner Spike",
    "Zufrieden, war ein normaler Tag",
    "Passt",
  ],
  3: [
    "Geht so",
    "Naja, war anstrengend",
    "Mittelprächtig, ein paar Schwankungen",
    "Nicht schlecht, nicht gut",
    "Bin müde",
    "Hatte nen Hänger am Nachmittag",
  ],
  2: [
    "Frustriert, Werte machen was sie wollen",
    "Hatte ne Hypo, das zieht runter",
    "Genervt vom ganzen Messen und Spritzen",
    "Schlechter Tag, null Motivation",
    "Ständig am Korrigieren, nervt",
    "Kopfschmerzen vom hohen Zucker",
  ],
  1: [
    "Alles Mist heute, heftige Hypo heute Nacht",
    "Komplett überfordert mit dem Diabetes",
    "Hasse es, immer an alles denken zu müssen",
    "Will einfach mal nen Tag ohne Diabetes",
    "Richtig fertig, zwei Hypos und nen Spike",
  ],
}

// ---------------------------------------------------------------------------
// CGM trace: anchor points + smooth cosine interpolation + smoothed noise
// ---------------------------------------------------------------------------

type Anchor = { t: number; v: number } // t = minutes of day (0..1440)

/** Smooth cosine interpolation between sorted anchors, sampled every 15 min (96 pts). */
function sampleCgm(anchors: Anchor[], rng: Rng): number[] {
  const sorted = [...anchors].sort((a, b) => a.t - b.t)
  const series: number[] = []
  let noisePrev = 0
  for (let i = 0; i < 96; i++) {
    const t = i * 15
    // Find bracketing anchors.
    let lo = sorted[0]
    let hi = sorted[sorted.length - 1]
    for (let k = 0; k < sorted.length - 1; k++) {
      if (t >= sorted[k].t && t <= sorted[k + 1].t) {
        lo = sorted[k]
        hi = sorted[k + 1]
        break
      }
    }
    let v: number
    if (hi.t === lo.t) {
      v = lo.v
    } else {
      const x = (t - lo.t) / (hi.t - lo.t)
      const w = (1 - Math.cos(Math.PI * clamp(x, 0, 1))) / 2 // smooth S-curve
      v = lo.v + (hi.v - lo.v) * w
    }
    // Smoothed sensor noise (AR(1)-ish so it's not jagged white noise).
    const amp = rand(rng, 3, 8)
    noisePrev = noisePrev * 0.55 + gauss(rng) * amp * 0.7
    series.push(clamp(Math.round(v + noisePrev), 40, 340))
  }
  return series
}

function contextForSlot(minutesOfDay: number, mealTimes: number[]): GlucoseContext {
  // Fasting around wake, bedtime late evening, post_meal within ~2h of a meal.
  if (minutesOfDay >= 6 * 60 && minutesOfDay <= 7 * 60 + 30) return "fasting"
  if (minutesOfDay >= 22 * 60) return "bedtime"
  for (const m of mealTimes) {
    if (minutesOfDay > m && minutesOfDay <= m + 130) return "post_meal"
    if (minutesOfDay >= m - 40 && minutesOfDay <= m) return "pre_meal"
  }
  return "other"
}

// ---------------------------------------------------------------------------
// Per-day plan
// ---------------------------------------------------------------------------

type DayPlan = {
  date: Date
  index: number
  rest: number // baseline BG center for the day
  moodTarget: number
  hypoNight: boolean
  hypoDay: boolean
  sick: boolean
  perfect: boolean
  forgotBolus: boolean
  doubleBolus: boolean
  restaurant: boolean
  sensorChange: boolean
}

function buildDayPlans(rng: Rng, dates: Date[]): DayPlan[] {
  const n = dates.length
  const indices = Array.from({ length: n }, (_, i) => i)

  // Pick a set of distinct day-indices for a given count.
  const pickDays = (count: number, filter?: (i: number) => boolean): Set<number> => {
    const pool = indices.filter((i) => (filter ? filter(i) : true))
    const out = new Set<number>()
    let guard = 0
    while (out.size < count && pool.length > 0 && guard < 1000) {
      guard++
      const idx = pool[Math.floor(rng() * pool.length)]
      out.add(idx)
    }
    return out
  }

  // ~3 hypos/week over 13 weeks → split between nights and days.
  const hypoNight = pickDays(20)
  const hypoDay = pickDays(20, (i) => !hypoNight.has(i))
  // Mid-June cold: 3 consecutive sick days (~Jun 13–15 → indices 43,44,45).
  const sick = new Set<number>([43, 44, 45])
  const perfect = pickDays(5, (i) => !hypoNight.has(i) && !hypoDay.has(i) && !sick.has(i))
  const forgotBolus = pickDays(2, (i) => !sick.has(i))
  const doubleBolus = pickDays(1, (i) => !forgotBolus.has(i) && !sick.has(i))
  const restaurant = pickDays(4)
  // Sensor change every ~11 days → ~2h CGM gap.
  const sensorChange = new Set<number>()
  for (let i = 2; i < n; i += 11) sensorChange.add(i)

  return dates.map((date, index) => {
    const { rest, mood } = interpNarrative(index)
    return {
      date,
      index,
      rest: Math.round(rest + gauss(rng) * 8),
      moodTarget: mood,
      hypoNight: hypoNight.has(index),
      hypoDay: hypoDay.has(index),
      sick: sick.has(index),
      perfect: perfect.has(index),
      forgotBolus: forgotBolus.has(index),
      doubleBolus: doubleBolus.has(index),
      restaurant: restaurant.has(index),
      sensorChange: sensorChange.has(index),
    }
  })
}

// ---------------------------------------------------------------------------
// Day generation
// ---------------------------------------------------------------------------

type PlannedMeal = {
  meal: Meal
  time: number // minutes of day
  bolus: number | null // units; null = no bolus given
  bolusTime: number | null
  bolusLate: boolean
  forgot: boolean // true only when a main-meal bolus was genuinely forgotten
  note: string | null
}

const ICR = 10 // grams carbs per unit of rapid insulin
const ISF = 40 // mg/dL drop per unit (used for corrections)

function planMeals(rng: Rng, plan: DayPlan): PlannedMeal[] {
  const weekend = isWeekend(plan.date)
  const meals: PlannedMeal[] = []

  const breakfast = pick(rng, BREAKFAST)
  const lunch = pick(rng, LUNCH)
  let dinner = pick(rng, DINNER)
  if (plan.restaurant) dinner = pick(rng, RESTAURANT)

  const bTime = weekend ? randInt(rng, 9 * 60, 10 * 60 + 30) : randInt(rng, 6 * 60 + 30, 8 * 60 + 30)
  const lTime = randInt(rng, 12 * 60, 13 * 60 + 30)
  const dTime = randInt(rng, 18 * 60, 20 * 60)

  const mainMeals: Array<{ meal: Meal; time: number }> = [
    { meal: breakfast, time: bTime },
    { meal: lunch, time: lTime },
    { meal: dinner, time: dTime },
  ]

  for (const { meal, time } of mainMeals) {
    const isRestaurantMeal = plan.restaurant && meal.mealType === "dinner"
    // Decide bolus behaviour.
    let bolus: number | null = Math.round((meal.carbs / ICR) * 10) / 10
    let bolusTime: number | null = time - randInt(rng, 5, 15) // usually pre-meal
    let bolusLate = false
    let note: string | null = isRestaurantMeal ? "KH geschätzt" : null

    // Forgot bolus: rare, and only the dinner of a flagged day (1 event/day).
    const forgot = plan.forgotBolus && meal.mealType === "dinner"
    if (forgot) {
      bolus = null
      bolusTime = null
    } else {
      // Sometimes the bolus is late (with or after the meal).
      if (rng() < 0.2) {
        bolusTime = time + randInt(rng, 10, 30)
        bolusLate = true
      }
      // Slightly off dose (±1 unit) — human imperfection.
      bolus = Math.max(0.5, Math.round((bolus + (rng() < 0.5 ? -1 : 1) * rng()) * 10) / 10)
      // Restaurant carb-guessing under-doses.
      if (isRestaurantMeal) bolus = Math.max(0.5, Math.round((bolus - rand(rng, 1, 2.5)) * 10) / 10)
      // Sick days: insulin resistance → needs more.
      if (plan.sick) bolus = Math.round((bolus + rand(rng, 1, 2.5)) * 10) / 10
    }

    meals.push({
      meal,
      time,
      bolus,
      bolusTime,
      bolusLate,
      forgot,
      note,
    })
  }

  // Snacks: 0–2 extra.
  const snackCount = randInt(rng, 0, 2)
  const snackWindows = [
    [10 * 60, 11 * 60],
    [15 * 60, 16 * 60 + 30],
    [21 * 60, 22 * 60],
  ]
  for (let s = 0; s < snackCount; s++) {
    const snack = pick(rng, SNACKS)
    const win = snackWindows[s % snackWindows.length]
    const time = randInt(rng, win[0], win[1])
    // Small snacks (<15g) often aren't bolused.
    const bolus = snack.carbs >= 15 ? Math.round((snack.carbs / ICR) * 10) / 10 : null
    meals.push({
      meal: snack,
      time,
      bolus,
      bolusTime: bolus != null ? time - randInt(rng, 0, 8) : null,
      bolusLate: false,
      forgot: false, // small snacks simply don't need a bolus — not "forgotten"
      note: null,
    })
  }

  return meals.sort((a, b) => a.time - b.time)
}

/** Spike size (mg/dL above pre-meal) for a meal given control + flags. */
function spikeFor(rng: Rng, plan: DayPlan, m: PlannedMeal): number {
  const giMult = m.meal.gi === "high" ? 1.2 : m.meal.gi === "low" ? 0.6 : 0.9
  let base: number
  if (m.bolus == null) base = rand(rng, 150, 190) // forgot bolus → massive
  else if (plan.perfect) base = rand(rng, 20, 40)
  else if (plan.sick) base = rand(rng, 70, 110)
  else if (m.note === "KH geschätzt") base = rand(rng, 90, 130) // under-dosed restaurant
  else if (plan.index >= 30 && plan.index <= 50) base = rand(rng, 70, 120) // burnout window erratic
  else base = rand(rng, 40, 80)
  if (m.bolusLate) base *= 1.3
  // Snacks make smaller spikes.
  if (m.meal.mealType === "snack") base *= 0.5
  return Math.round(base * giMult)
}

type DayResult = {
  entries: EntryRow[]
  glucose: GlucoseRow[]
  insulin: InsulinRow[]
  meals: MealRow[]
  mood: MoodRow[]
  activity: ActivityRow[]
  dayAvg: number
  hypoOccurred: boolean
  tir: number
}

function mkEntry(
  userId: string,
  source: "manual" | "import",
  type: EntryRow["type"],
  timestamp: string,
  note: string | null
): EntryRow {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    source,
    type,
    timestamp,
    note,
    conversation_id: null,
  }
}

function generateDay(userId: string, plan: DayPlan, baseMood: number, rng: Rng): DayResult {
  const res: DayResult = {
    entries: [],
    glucose: [],
    insulin: [],
    meals: [],
    mood: [],
    activity: [],
    dayAvg: 0,
    hypoOccurred: false,
    tir: 0,
  }

  const plannedMeals = planMeals(rng, plan)
  const mealTimes = plannedMeals.map((m) => m.time)

  // --- Build CGM anchors -------------------------------------------------
  const anchors: Anchor[] = []
  const rest = plan.rest

  // Overnight start (carried roughly from rest level).
  anchors.push({ t: 0, v: clamp(rest - rand(rng, 0, 20), 70, 200) })

  // Nocturnal low (hypo night): gradual drop to 50–65 around 02:00–04:00.
  if (plan.hypoNight) {
    anchors.push({ t: randInt(rng, 120, 240), v: randInt(rng, 50, 65) })
    // Rebound (counter-regulation / treatment) toward a high-ish fasting value.
    anchors.push({ t: 5 * 60, v: randInt(rng, 120, 150) })
    res.hypoOccurred = true
  } else {
    anchors.push({ t: 3 * 60, v: clamp(rest - rand(rng, 5, 25), 65, 180) })
  }

  // Dawn phenomenon: rise from ~04:00 to ~07:00.
  const fasting = plan.perfect
    ? randInt(rng, 90, 115)
    : clamp(Math.round(rest - rand(rng, 5, 20) + (plan.hypoNight ? 20 : rand(rng, 10, 30))), 80, 200)
  anchors.push({ t: 6 * 60 + 30, v: fasting })

  // Meals: pre / peak / return anchors.
  let level = fasting
  for (const m of plannedMeals) {
    const pre = clamp(Math.round(level + gauss(rng) * 8), 60, 220)
    anchors.push({ t: Math.max(0, m.time - 10), v: pre })
    const peakDelay = m.meal.gi === "high" ? randInt(rng, 45, 60) : randInt(rng, 70, 90)
    const peak = clamp(pre + spikeFor(rng, plan, m), 70, 340)
    anchors.push({ t: m.time + peakDelay, v: peak })

    // Where does it come back to? Hypo-day lunch over-correction dips low.
    const overcorrect = plan.hypoDay && m.meal.mealType === "lunch"
    if (overcorrect) {
      const low = randInt(rng, 54, 68)
      anchors.push({ t: m.time + 170, v: low })
      // Fast-carb treatment rebound.
      anchors.push({ t: m.time + 210, v: randInt(rng, 130, 165) })
      res.hypoOccurred = true
      level = 130
    } else {
      const back = plan.sick
        ? clamp(rest + rand(rng, 0, 25), 150, 280)
        : clamp(Math.round(rest + gauss(rng) * 10), 70, 220)
      anchors.push({ t: m.time + 150, v: back })
      level = back
    }
  }

  // Double-bolus mistake: crash to 50–60 mid-afternoon + treatment rebound.
  if (plan.doubleBolus) {
    anchors.push({ t: 16 * 60, v: randInt(rng, 50, 60) })
    anchors.push({ t: 16 * 60 + 40, v: randInt(rng, 120, 150) })
    res.hypoOccurred = true
  }

  // Activity dip (if any) — placed in the late afternoon/evening.
  let activity: Activity | null = null
  let activityTime = 0
  const activeChance = isWeekend(plan.date) ? 0.6 : 0.45
  if (!plan.sick && rng() < activeChance) {
    activity = pick(rng, ACTIVITIES)
    activityTime = randInt(rng, 16 * 60, 19 * 60)
    const dip = randInt(rng, 20, 50) + (activity.intensity === "high" ? 10 : 0)
    anchors.push({ t: activityTime + activity.min, v: clamp(level - dip, 55, 220) })
  }

  // Bedtime + end-of-day.
  anchors.push({ t: 22 * 60 + 30, v: clamp(Math.round(rest + gauss(rng) * 12), 70, 220) })
  anchors.push({ t: 1440, v: clamp(rest - rand(rng, 0, 15), 70, 200) })

  if (plan.perfect) {
    // Flatten everything into a tight, in-range band.
    for (const a of anchors) a.v = clamp(a.v, 85, 150)
  }

  // --- Sample 96 CGM readings + sensor gaps ------------------------------
  const series = sampleCgm(anchors, rng)
  const skip = new Set<number>()
  // Random short gaps (~1–2/week → ~0.2/day): 2–4 consecutive missing readings.
  if (rng() < 0.2) {
    const start = randInt(rng, 4, 88)
    const len = randInt(rng, 2, 4)
    for (let k = 0; k < len; k++) skip.add(start + k)
  }
  // Sensor change: ~2h warmup gap (8 readings).
  if (plan.sensorChange) {
    const start = randInt(rng, 8, 40)
    for (let k = 0; k < 8; k++) skip.add(start + k)
  }

  const kept: number[] = []
  for (let i = 0; i < 96; i++) {
    if (skip.has(i)) continue
    const minutesOfDay = i * 15
    const ts = toBerlinIso(plan.date, minutesOfDay)
    const entry = mkEntry(userId, "import", "glucose", ts, null)
    res.entries.push(entry)
    res.glucose.push({
      entry_id: entry.id,
      value: series[i],
      context: contextForSlot(minutesOfDay, mealTimes),
    })
    kept.push(series[i])
  }

  res.dayAvg = Math.round(kept.reduce((s, v) => s + v, 0) / Math.max(1, kept.length))
  res.tir = kept.filter((v) => v >= 70 && v <= 180).length / Math.max(1, kept.length)
  if (kept.some((v) => v < 70)) res.hypoOccurred = true

  // --- Meals + boluses + corrections (manual logs) -----------------------
  for (const m of plannedMeals) {
    const mealTs = toBerlinIso(plan.date, m.time)
    const mealEntry = mkEntry(userId, "manual", "meal", mealTs, m.note)
    res.entries.push(mealEntry)
    let linkedInsulinId: string | null = null

    if (m.bolus != null && m.bolusTime != null) {
      const insTs = toBerlinIso(plan.date, m.bolusTime)
      const insEntry = mkEntry(
        userId,
        "manual",
        "insulin",
        insTs,
        m.bolusLate ? "Bolus etwas spät" : null
      )
      res.entries.push(insEntry)
      res.insulin.push({
        entry_id: insEntry.id,
        dose: m.bolus,
        insulin_type: "rapid",
        insulin_entry_type: "meal_bolus",
        insulin_name: "NovoRapid",
      })
      linkedInsulinId = insEntry.id

      // Double-bolus mistake: a second identical bolus within ~5 min.
      if (plan.doubleBolus && m.meal.mealType === "lunch") {
        const insTs2 = toBerlinIso(plan.date, m.bolusTime + randInt(rng, 2, 5))
        const insEntry2 = mkEntry(userId, "manual", "insulin", insTs2, "Versehentlich doppelt gespritzt")
        res.entries.push(insEntry2)
        res.insulin.push({
          entry_id: insEntry2.id,
          dose: m.bolus,
          insulin_type: "rapid",
          insulin_entry_type: "meal_bolus",
          insulin_name: "NovoRapid",
        })
      }
    } else if (m.forgot) {
      // Genuinely forgot the meal bolus → late correction ~60–90 min later.
      const corrTs = toBerlinIso(plan.date, m.time + randInt(rng, 60, 90))
      const corrDose = Math.max(2, Math.round(((rest + 120 - 120) / ISF + 2) * 10) / 10)
      const corrEntry = mkEntry(userId, "manual", "insulin", corrTs, "Korrektur (Bolus vergessen)")
      res.entries.push(corrEntry)
      res.insulin.push({
        entry_id: corrEntry.id,
        dose: corrDose,
        insulin_type: "rapid",
        insulin_entry_type: "correction",
        insulin_name: "NovoRapid",
      })
    }

    res.meals.push({
      entry_id: mealEntry.id,
      description: m.meal.description,
      carbs_grams: m.meal.carbs,
      meal_type: m.meal.mealType,
      linked_insulin_id: linkedInsulinId,
      source: "manual",
    })
  }

  // Hypo treatment snack (fast carbs) on hypo days.
  if (res.hypoOccurred && rng() < 0.8) {
    const treatTime = plan.hypoDay ? randInt(rng, 15 * 60, 16 * 60) : randInt(rng, 3 * 60, 5 * 60)
    const treatTs = toBerlinIso(plan.date, treatTime)
    const treatEntry = mkEntry(userId, "manual", "meal", treatTs, "Hypo behandelt")
    res.entries.push(treatEntry)
    res.meals.push({
      entry_id: treatEntry.id,
      description: "Traubenzucker",
      carbs_grams: randInt(rng, 10, 20),
      meal_type: "snack",
      linked_insulin_id: null,
      source: "manual",
    })
  }

  // Correction bolus when daytime BG is high and not at a meal (bad days).
  if (!plan.perfect && res.dayAvg > 170) {
    const corrections = randInt(rng, 1, plan.sick ? 3 : 2)
    for (let c = 0; c < corrections; c++) {
      const ct = randInt(rng, 11 * 60, 21 * 60)
      const estBg = randInt(rng, 190, 260)
      const dose = Math.max(1, Math.round(((estBg - 120) / ISF) * 10) / 10)
      const cEntry = mkEntry(userId, "manual", "insulin", toBerlinIso(plan.date, ct), "Korrektur")
      res.entries.push(cEntry)
      res.insulin.push({
        entry_id: cEntry.id,
        dose,
        insulin_type: "rapid",
        insulin_entry_type: "correction",
        insulin_name: "NovoRapid",
      })
    }
  }

  // --- Basal insulin (Lantus) once in the evening -------------------------
  const basalTs = toBerlinIso(plan.date, randInt(rng, 21 * 60, 22 * 60 + 30))
  const basalEntry = mkEntry(userId, "manual", "insulin", basalTs, null)
  res.entries.push(basalEntry)
  res.insulin.push({
    entry_id: basalEntry.id,
    dose: randInt(rng, 18, 22),
    insulin_type: "long_acting",
    insulin_entry_type: "basal",
    insulin_name: "Lantus",
  })

  // --- Activity entry -----------------------------------------------------
  if (activity) {
    const aEntry = mkEntry(userId, "manual", "activity", toBerlinIso(plan.date, activityTime), null)
    res.entries.push(aEntry)
    res.activity.push({
      entry_id: aEntry.id,
      activity_type: activity.name,
      duration_minutes: randInt(rng, activity.min, activity.max),
      intensity: activity.intensity,
    })
  }

  // --- Mood: exactly 3 entries (morning / afternoon / evening) ------------
  // BG-mood correlation: real but noisy. We center the adjustment on the day's
  // EXPECTED level (rest + the usual spike-driven elevation of the daily mean),
  // so a worse-than-expected day lowers mood and a better one lifts it — without
  // a constant downward pull that would push the whole arc too low.
  const expectedMean = plan.rest + 12
  let bgAdj = clamp((expectedMean - res.dayAvg) / 95, -0.5, 0.5)
  if (res.hypoOccurred) bgAdj -= rand(rng, 0.2, 0.45)
  if (res.tir > 0.85) bgAdj += rand(rng, 0.1, 0.3)
  if (plan.sick) bgAdj -= rand(rng, 0.2, 0.45)
  if (plan.perfect) bgAdj += rand(rng, 0.3, 0.6)

  // "Life happens": a per-day mood offset that has nothing to do with the
  // blood sugar. This is what makes the BG-mood link real but imperfect
  // (~60-70%) — some rough-BG days still feel fine, some good ones don't.
  const dayNoise = gauss(rng) * 0.95

  const moodSlots: Array<{ min: [number, number]; spread: number }> = [
    { min: [7 * 60, 9 * 60], spread: 0.55 }, // morning
    { min: [13 * 60, 15 * 60], spread: 0.55 }, // afternoon
    { min: [20 * 60, 22 * 60], spread: 0.4 }, // evening
  ]
  for (const slot of moodSlots) {
    const raw = baseMood + bgAdj + dayNoise + gauss(rng) * slot.spread
    const value = clamp(Math.round(raw), 1, 5) as MoodValue
    const note = pick(rng, MOOD_TEXTS[value])
    const ts = toBerlinIso(plan.date, randInt(rng, slot.min[0], slot.min[1]))
    const mEntry = mkEntry(userId, "manual", "mood", ts, note)
    res.entries.push(mEntry)
    res.mood.push({ entry_id: mEntry.id, mood_value: value })
  }

  return res
}

// ---------------------------------------------------------------------------
// Buddy conversations (data-aware, empathic, no insulin advice, clinically safe)
// ---------------------------------------------------------------------------

type ConvoTemplate = {
  dayIndex: number
  startMin: number
  title: string
  summary: string
  emoji: string
  tags: ConversationTag[]
  emotions: ConversationEmotions
  turns: Array<{ role: "user" | "assistant"; text: string }>
}

const EM = (
  happiness: number,
  surprise: number,
  sadness: number,
  anger: number,
  fear: number,
  disgust: number
): ConversationEmotions => ({ happiness, surprise, sadness, anger, fear, disgust })

const CONVERSATIONS: ConvoTemplate[] = [
  {
    dayIndex: 8,
    startMin: 20 * 60 + 30,
    title: "Alltagsstress und hohe Werte",
    summary:
      "Der Nutzer erlebt eine stressige Phase mit wenig Schlaf und dauerhaft hohen Werten. Gluco validiert die Belastung, erklärt den Zusammenhang von Stresshormonen und Blutzucker neutral und fokussiert auf kleine, machbare Schritte statt Perfektion.",
    emoji: "😣",
    tags: [
      { emoji: "🧠", label: "Stress" },
      { emoji: "📈", label: "Hohe Werte" },
    ],
    emotions: EM(0.15, 0.1, 0.4, 0.35, 0.5, 0.1),
    turns: [
      { role: "assistant", text: "Hey, schön dass du da bist. Mir ist aufgefallen, dass deine Werte die letzten Tage öfter über 200 waren – wie geht's dir gerade damit?" },
      { role: "user", text: "Sehr stressig. Viel los bei der Arbeit, zu wenig Schlaf, und egal was ich mache: der Zucker bleibt oben." },
      { role: "assistant", text: "Das klingt nach einer richtig anstrengenden Phase. Stresshormone können den Blutzucker deutlich hochziehen – das ist keine Schwäche von dir, das ist Biologie. Was zehrt gerade am meisten an dir?" },
      { role: "user", text: "Dieses Gefühl, dass ich weder den Alltag noch den Diabetes richtig im Griff hab." },
      { role: "assistant", text: "Das ist viel auf einmal. Du musst in solchen Wochen nicht perfekte Werte liefern. Dranbleiben reicht. Gibt es eine kleine Pause oder Routine, die dir zwischendurch guttut?" },
      { role: "user", text: "Kurz rausgehen hilft eigentlich. Mach ich nur zu selten." },
      { role: "assistant", text: "Das ist ein guter Anker – kurz rausgehen tut dem Kopf gut und oft auch dem Zucker. Vielleicht planst du es dir morgen einmal fest ein. Ich bin da, wenn du erzählen willst, wie es dir damit geht." },
    ],
  },
  {
    dayIndex: 19,
    startMin: 22 * 60,
    title: "Frustrierende Nacht",
    summary:
      "Nach einer nächtlichen Unterzuckerung ist der Nüchternwert hoch. Gluco erklärt vorsichtig, dass es dafür mehrere mögliche Ursachen gibt, vermeidet eine eindeutige Festlegung und verweist für die Einordnung ausdrücklich auf das Diabetesteam.",
    emoji: "😟",
    tags: [
      { emoji: "🌙", label: "Nacht-Hypo" },
      { emoji: "🩺", label: "Diabetesteam" },
    ],
    emotions: EM(0.1, 0.15, 0.5, 0.2, 0.55, 0.1),
    turns: [
      { role: "assistant", text: "Hey, ich seh dass du heute Nacht eine Hypo hattest und morgens trotzdem hoch warst. Das ist ein zermürbender Mix – wie sitzt das bei dir?" },
      { role: "user", text: "Ich versteh's einfach nicht. Erst 55 mitten in der Nacht, dann morgens 160. Hab ich was falsch gemacht?" },
      { role: "assistant", text: "Erstmal: das klingt nicht nach einem Fehler von dir. Für hohe Nüchternwerte nach einer nächtlichen Hypo gibt es mehrere mögliche Erklärungen – zum Beispiel das Dawn-Phänomen, ein über Nacht nachlassendes Basalinsulin oder dass die Hypo mit recht vielen Kohlenhydraten behandelt wurde. Was davon bei dir zutrifft, lässt sich am besten mit deinem Diabetesteam anhand deiner Daten einordnen." },
      { role: "user", text: "Okay, das beruhigt mich ein bisschen. Ich dachte schon, ich mach alles kaputt." },
      { role: "assistant", text: "Tust du nicht. Eine Nacht-Hypo ist beängstigend, und dass du dir Gedanken machst, zeigt nur, wie sehr du dranbleibst. Magst du den Wert beim nächsten Termin ansprechen? Dann kann jemand mit dem ganzen Bild drüberschauen." },
      { role: "user", text: "Ja, ich schreib's mir auf für die Diabetologin." },
      { role: "assistant", text: "Das ist ein guter Schritt. Und heute darfst du auch mal kurz durchatmen – die Nacht war anstrengend genug. Ich bin da, wenn du wieder reden magst." },
    ],
  },
  {
    dayIndex: 33,
    startMin: 21 * 60 + 15,
    title: "Hab keine Lust mehr",
    summary:
      "Deutliche Zeichen von Diabetes-Burnout: Erschöpfung und nachlassende Motivation beim Messen und Spritzen. Gluco normalisiert das Erleben, nimmt Schuld heraus und fragt nach kleinen Ressourcen, ohne Druck aufzubauen.",
    emoji: "😔",
    tags: [
      { emoji: "🔋", label: "Burnout" },
      { emoji: "💭", label: "Motivation" },
    ],
    emotions: EM(0.07, 0.06, 0.62, 0.3, 0.45, 0.16),
    turns: [
      { role: "assistant", text: "Hey. Die letzten zwei Wochen waren bei deinen Werten ganz schön Achterbahn. Wie geht es dir eigentlich – nicht den Zahlen, dir?" },
      { role: "user", text: "Ehrlich? Ich hab einfach keine Lust mehr. Messen, spritzen, rechnen. Jeden Tag. Ich bin durch." },
      { role: "assistant", text: "Das ist Diabetes-Burnout, und das ist genauso real wie der Diabetes selbst. Diese ständige Last, jeden einzelnen Tag – das ist verdammt viel. Dass du gerade so fühlst, heißt nicht, dass du schwach bist, sondern dass du lange viel getragen hast." },
      { role: "user", text: "Manchmal lass ich das Messen einfach. Ich weiß, dass das nicht gut ist." },
      { role: "assistant", text: "Das muss ich nicht bewerten – ich versteh, woher das kommt. Diabetes-Management ist kein Alles-oder-Nichts. Wenn sechsmal messen gerade zu viel ist, sind dreimal auch schon richtig viel. Gibt es etwas in deinem Alltag, das sich gerade noch leicht anfühlt?" },
      { role: "user", text: "Mit meinem Hund rausgehen. Da denk ich an nichts." },
      { role: "assistant", text: "Das ist Gold wert – Bewegung, frische Luft und Abstand vom Kopfkino, alles in einem. Lass uns das als deinen Anker nehmen, nicht als Pflicht. Und wenn das Schwere bleibt: Wäre die Diabetologin jemand, mit dem du darüber reden könntest?" },
      { role: "user", text: "Vielleicht. Ich hab bald eh einen Termin." },
      { role: "assistant", text: "Das klingt nach einem guten Moment, es anzusprechen. Du hast heute etwas Wichtiges getan – ausgesprochen, dass es zu viel ist. Ich bin hier, ganz ohne Erwartungen." },
    ],
  },
  {
    dayIndex: 40,
    startMin: 20 * 60 + 45,
    title: "Alles Achterbahn",
    summary:
      "Tag mit stark schwankenden Werten und Erschöpfung. Gluco bleibt bei den Gefühlen, spiegelt die Frustration und hilft, einen einzelnen nächsten Mini-Schritt zu finden, statt alles auf einmal lösen zu wollen.",
    emoji: "🎢",
    tags: [
      { emoji: "🎢", label: "Schwankungen" },
      { emoji: "😮‍💨", label: "Erschöpfung" },
    ],
    emotions: EM(0.08, 0.2, 0.5, 0.32, 0.4, 0.14),
    turns: [
      { role: "assistant", text: "Hey, dein Tag sah heute echt wild aus – von tief bis über 250 alles dabei. Das macht müde, oder?" },
      { role: "user", text: "Total. Ich korrigier den ganzen Tag hoch und runter und komm trotzdem nicht zur Ruhe." },
      { role: "assistant", text: "Dieses ständige Hinterherjagen ist unglaublich zermürbend – nicht nur körperlich, auch im Kopf. Du machst gerade viel, auch wenn sich's nicht nach Erfolg anfühlt." },
      { role: "user", text: "Es fühlt sich an wie umsonst." },
      { role: "assistant", text: "Dass es sich umsonst anfühlt, heißt nicht, dass es das ist – an einem so schwankenden Tag ist Stabilität fast unmöglich, egal wie gut man es macht. Wenn du auf morgen schaust: Gibt es eine einzige kleine Sache, die dir den Tag leichter machen würde?" },
      { role: "user", text: "Vielleicht einfach früher schlafen. Ich bin nur noch gerädert." },
      { role: "assistant", text: "Das klingt nach echter Selbstfürsorge, nicht nach Aufgeben. Schlaf hilft auch dem Zucker mehr, als man denkt. Mach heute den Haken dahinter – der Rest darf warten." },
    ],
  },
  {
    dayIndex: 45,
    startMin: 13 * 60 + 30,
    title: "Erkältet und alles hoch",
    summary:
      "Krankheitstag mit erhöhten Werten trotz mehr Insulin. Gluco erklärt neutral, dass Infekte den Insulinbedarf erhöhen können, betont Erholung und verweist bei Unsicherheit auf das Behandlungsteam – ohne Dosierungsempfehlung.",
    emoji: "🤒",
    tags: [
      { emoji: "🤒", label: "Krank" },
      { emoji: "📈", label: "Hohe Werte" },
    ],
    emotions: EM(0.05, 0.12, 0.45, 0.2, 0.5, 0.2),
    turns: [
      { role: "assistant", text: "Hey, ich seh dass deine Werte seit zwei Tagen deutlich höher liegen – und du hattest geschrieben, dass du erkältet bist. Wie fühlst du dich?" },
      { role: "user", text: "Schlapp. Und der Zucker geht einfach nicht runter, obwohl ich mehr spritze." },
      { role: "assistant", text: "Das ist gerade doppelt anstrengend – krank sein und dann auch noch zähe Werte. Bei einem Infekt braucht der Körper oft mehr Insulin, weil Stresshormone den Zucker oben halten. Wie genau du jetzt anpasst, klärst du am besten mit deinem Diabetesteam – gerade an Krankheitstagen ist das wichtig." },
      { role: "user", text: "Ja, hab schon überlegt, da anzurufen." },
      { role: "assistant", text: "Das klingt sehr vernünftig. Viele Praxen haben für genau solche Tage Hinweise. Und davon ab: Ausruhen ist gerade keine Faulheit, sondern Teil der Behandlung. Trinkst du genug?" },
      { role: "user", text: "Geht so, mach ich aber gleich." },
      { role: "assistant", text: "Gut. Sei heute mild mit dir – der Körper hat genug zu tun. Ich bin da, wenn du dich melden magst." },
    ],
  },
  {
    dayIndex: 54,
    startMin: 19 * 60 + 30,
    title: "Sorge vor dem nächsten HbA1c",
    summary:
      "Vor dem nächsten Arzttermin ist der Nutzer angespannt wegen des HbA1c. Gluco nimmt die Sorge ernst, reduziert Schuldgefühle und unterstützt dabei, den Termin als gemeinsame Standortbestimmung zu sehen.",
    emoji: "😬",
    tags: [
      { emoji: "🩺", label: "Arzttermin" },
      { emoji: "🧪", label: "HbA1c" },
    ],
    emotions: EM(0.22, 0.15, 0.3, 0.1, 0.38, 0.05),
    turns: [
      { role: "assistant", text: "Hey, du hast bald deinen Termin – beschäftigt dich das gerade?" },
      { role: "user", text: "Ja, total. Ich hab Angst, dass mein HbA1c schlechter ist als gehofft." },
      { role: "assistant", text: "Das ist sehr nachvollziehbar. So ein Wert fühlt sich schnell wie ein Urteil an, obwohl er nur ein Ausschnitt ist. Der Termin darf auch dazu da sein, gemeinsam zu schauen, was im Alltag realistisch funktioniert." },
      { role: "user", text: "Ich hab trotzdem ein schlechtes Gewissen." },
      { role: "assistant", text: "Schuldgefühle sind häufig – aber sie helfen selten. Du trägst jeden Tag viel Verantwortung. Vielleicht hilft es, vor dem Termin 2–3 Situationen zu notieren, die dir besonders schwerfallen. Dann wird das Gespräch konkreter." },
      { role: "user", text: "Gute Idee. Dann geh ich nicht mit leerem Kopf rein." },
      { role: "assistant", text: "Genau. Du gehst vorbereitet und nicht allein damit rein. Wenn du magst, können wir danach gemeinsam sortieren, was für dich machbar wirkt." },
    ],
  },
  {
    dayIndex: 64,
    startMin: 20 * 60,
    title: "Kleine Routine, die hilft",
    summary:
      "Der Nutzer findet eine kleine, alltagstaugliche Routine, die Werte und Stimmung stabilisiert. Gluco verstärkt den Erfolg und betont, dass Unterstützung durch nahestehende Menschen entlasten kann.",
    emoji: "💪",
    tags: [
      { emoji: "🧩", label: "Routine" },
      { emoji: "🤝", label: "Unterstützung" },
      { emoji: "✅", label: "Stabilität" },
    ],
    emotions: EM(0.55, 0.15, 0.12, 0.05, 0.15, 0.04),
    turns: [
      { role: "assistant", text: "Hey, deine Werte wirken diese Woche deutlich ruhiger. Merkst du im Alltag auch einen Unterschied?" },
      { role: "user", text: "Ja, ich bin weniger im Kopfkino. Ich hab jetzt eine Mini-Routine: nach dem Abendessen 10 Minuten laufen und danach kurz Werte checken." },
      { role: "assistant", text: "Das klingt richtig gut – klein, konkret und machbar. Genau solche Routinen halten oft länger als große Vorsätze. Was hilft dir, sie beizubehalten?" },
      { role: "user", text: "Mein Partner erinnert mich freundlich dran, wenn ich's vergesse." },
      { role: "assistant", text: "Das ist starke Unterstützung. Nicht Kontrolle, sondern Entlastung. Und du setzt es um – das ist deine Leistung." },
      { role: "user", text: "Ja, fühlt sich zum ersten Mal seit langem stabil an." },
      { role: "assistant", text: "Freut mich sehr. Halt die Routine ruhig bewusst klein, damit sie auch in stressigen Wochen tragfähig bleibt." },
    ],
  },
  {
    dayIndex: 72,
    startMin: 18 * 60 + 30,
    title: "Sport hilft",
    summary:
      "Der Nutzer entdeckt, dass regelmäßige Bewegung sowohl den Werten als auch der Stimmung guttut. Gluco bestärkt das als Ressource, ohne es zur Pflicht zu machen.",
    emoji: "🏃",
    tags: [
      { emoji: "🏃", label: "Bewegung" },
      { emoji: "🙂", label: "Stimmung" },
    ],
    emotions: EM(0.6, 0.12, 0.1, 0.04, 0.12, 0.03),
    turns: [
      { role: "assistant", text: "Hey, mir ist aufgefallen, dass du in letzter Zeit öfter spazieren oder radeln warst – und deine Nachmittagswerte sehen ruhiger aus. Wie fühlt sich das an?" },
      { role: "user", text: "Richtig gut. Nach dem Joggen bin ich entspannter und der Zucker bleibt stabiler." },
      { role: "assistant", text: "Das ist ein schöner Doppel-Effekt – Bewegung tut dem Kopf und dem Blutzucker gut. Und das Beste: Du machst es, weil es dir guttut, nicht weil du musst." },
      { role: "user", text: "Genau. Es fühlt sich nicht wie Therapie an." },
      { role: "assistant", text: "Das ist der Punkt. Wenn etwas sich nicht nach Pflicht anfühlt, hält man es eher durch. Magst du dir eine lockere kleine Gewohnheit draus machen – ganz ohne Leistungsdruck?" },
      { role: "user", text: "Ja, so zwei-, dreimal die Woche. Ohne Stress." },
      { role: "assistant", text: "Klingt perfekt. Genieß die Runden – und erzähl mir gern, wie es dir damit weiter geht." },
    ],
  },
  {
    dayIndex: 80,
    startMin: 21 * 60,
    title: "Endlich stabile Werte",
    summary:
      "Der Nutzer ist stolz auf eine ruhige, gut im Zielbereich liegende Phase. Gluco würdigt den Weg dorthin und hilft, den Erfolg als eigene Leistung anzuerkennen.",
    emoji: "😌",
    tags: [
      { emoji: "✅", label: "Stabil" },
      { emoji: "🌟", label: "Stolz" },
    ],
    emotions: EM(0.62, 0.18, 0.08, 0.03, 0.1, 0.03),
    turns: [
      { role: "assistant", text: "Hey, deine Zeit im Zielbereich war diese Woche richtig hoch. Das ist nach den letzten Monaten eine Hausnummer – wie geht's dir damit?" },
      { role: "user", text: "Ehrlich gesagt ein bisschen stolz. Im Juni dachte ich noch, ich pack das nie." },
      { role: "assistant", text: "Dieser Satz hat Gewicht – von 'ich pack das nie' zu 'ich bin stolz'. Das ist nicht passiert, das hast du erarbeitet. Was nimmst du aus den letzten Wochen mit?" },
      { role: "user", text: "Dass weniger Druck mir mehr hilft als mehr Kontrolle." },
      { role: "assistant", text: "Das ist eine richtig wertvolle Erkenntnis – und sie trägt auch über schlechtere Tage, die wieder kommen werden. Dann ist das keine Niederlage, sondern Teil der Achterbahn." },
      { role: "user", text: "Ja. Ich glaub, ich geh entspannter damit um." },
      { role: "assistant", text: "Das klingt nach einem guten Platz, an dem du gerade bist. Ich freu mich sehr mit dir – und bleib in der Nähe." },
    ],
  },
  {
    dayIndex: 27,
    startMin: 22 * 60 + 10,
    title: "Angst vor Hypos in der Nacht",
    summary:
      "Der Nutzer schläft schlecht aus Angst vor nächtlichen Unterzuckerungen. Gluco nimmt die Angst ernst, ohne sie zu verstärken, und ermutigt, das Thema Sicherheit in der Nacht mit dem Diabetesteam zu besprechen.",
    emoji: "😨",
    tags: [
      { emoji: "🌙", label: "Hypo-Angst" },
      { emoji: "😴", label: "Schlaf" },
    ],
    emotions: EM(0.08, 0.18, 0.4, 0.12, 0.62, 0.08),
    turns: [
      { role: "assistant", text: "Hey, du wirkst die letzten Tage angespannt – und nachts gab es ein paar tiefe Werte. Geht dir das im Kopf rum?" },
      { role: "user", text: "Ja, ich trau mich kaum noch richtig zu schlafen. Was, wenn ich eine Hypo verschlafe?" },
      { role: "assistant", text: "Diese Angst ist absolut verständlich – nächtliche Hypos sind beängstigend, und der Wunsch, sicher zu sein, ist völlig berechtigt. Wie sehr raubt dir das gerade den Schlaf?" },
      { role: "user", text: "Ziemlich. Ich wach ständig auf und check den Wert." },
      { role: "assistant", text: "Das zermürbt mit der Zeit. Es gibt Wege, die Nacht sicherer zu machen – aber welche für dich passen, bespricht man am besten mit dem Diabetesteam, die kennen deine Werte. Wäre das ein Thema für deinen nächsten Termin?" },
      { role: "user", text: "Ja, das nehm ich mit. Allein das Gefühl, dass man was tun kann, hilft schon." },
      { role: "assistant", text: "Genau – du bist dem nicht hilflos ausgeliefert. Heute Nacht darfst du wissen: Du passt sehr gut auf dich auf. Ich bin da, wenn du reden magst." },
    ],
  },
  {
    dayIndex: 88,
    startMin: 20 * 60 + 30,
    title: "Ein richtig guter Tag",
    summary:
      "Ein rundum guter Tag mit stabilen Werten und guter Stimmung. Gluco genießt den Moment mit, ohne ihn zu zerreden, und hält die Erinnerung als Ressource für schwerere Tage fest.",
    emoji: "😄",
    tags: [
      { emoji: "🌟", label: "Guter Tag" },
      { emoji: "🙂", label: "Stimmung" },
    ],
    emotions: EM(0.7, 0.15, 0.05, 0.02, 0.06, 0.02),
    turns: [
      { role: "assistant", text: "Hey, dein Tag sah heute richtig rund aus – stabile Werte, kaum Schwankungen. Wie war er für dich?" },
      { role: "user", text: "Echt schön. Einer von den Tagen, an denen Diabetes mal nicht alles bestimmt." },
      { role: "assistant", text: "Solche Tage sind kostbar. Schön, dass du ihn so wahrnimmst, statt direkt zu fragen, was du beim nächsten besser machen musst." },
      { role: "user", text: "Stimmt, das mach ich sonst oft." },
      { role: "assistant", text: "Dann lass uns den heute einfach stehen lassen, wie er ist – gut. Vielleicht merkst du ihn dir für einen schwereren Tag: Beweis, dass es auch leicht gehen kann." },
      { role: "user", text: "Mach ich. Tut gut, das mal festzuhalten." },
      { role: "assistant", text: "Genieß den Abend. Ich freu mich mit dir – bis zum nächsten Mal." },
    ],
  },
]

function buildConversations(userId: string, dates: Date[]): { conversations: ConversationRow[]; messages: MessageRow[] } {
  const conversations: ConversationRow[] = []
  const messages: MessageRow[] = []

  for (const tpl of CONVERSATIONS) {
    const date = dates[clamp(tpl.dayIndex, 0, dates.length - 1)]
    const convId = crypto.randomUUID()
    const started = toBerlinIso(date, tpl.startMin)
    const ended = toBerlinIso(date, tpl.startMin + tpl.turns.length * 3 + 2)
    conversations.push({
      id: convId,
      user_id: userId,
      title: tpl.title,
      summary: tpl.summary,
      mood_emoji: tpl.emoji,
      tags: tpl.tags,
      emotions: tpl.emotions,
      is_active: false,
      started_at: started,
      ended_at: ended,
    })
    tpl.turns.forEach((turn, i) => {
      messages.push({
        id: crypto.randomUUID(),
        conversation_id: convId,
        role: turn.role,
        content: turn.text,
        timestamp: toBerlinIso(date, tpl.startMin + i * 3),
      })
    })
  }

  return { conversations, messages }
}

// ---------------------------------------------------------------------------
// Insights + goals (a small, narrative-consistent set)
// ---------------------------------------------------------------------------

function buildInsightsAndGoals(userId: string): { insights: InsightRow[]; goals: GoalRow[] } {
  const insights: InsightRow[] = [
    {
      user_id: userId,
      type: "pattern",
      title: "Morgens oft erhöht",
      description:
        "An vielen Tagen liegt dein Nüchternwert höher als der Rest des Vormittags. Dafür gibt es mehrere mögliche Erklärungen – sprich das gern mit deinem Diabetesteam an.",
      category: "glucose",
      dismissed: false,
    },
    {
      user_id: userId,
      type: "stat",
      title: "Zeit im Zielbereich verbessert sich",
      description:
        "Deine Zeit im Zielbereich ist von Mai bis Juli spürbar gestiegen. Kleine Schritte zahlen sich aus.",
      category: "glucose",
      dismissed: false,
    },
    {
      user_id: userId,
      type: "theme",
      title: "Bewegung tut dir gut",
      description:
        "An Tagen mit einem Spaziergang oder Sport sind deine Nachmittagswerte ruhiger – und deine Stimmung etwas besser.",
      category: "activity",
      dismissed: false,
    },
    {
      user_id: userId,
      type: "motivation",
      title: "Du bleibst dran",
      description:
        "Auch in schweren Wochen hast du weiter dokumentiert. Das ist genau die Beständigkeit, die langfristig hilft.",
      category: "mood",
      dismissed: false,
    },
  ]

  const goals: GoalRow[] = [
    {
      user_id: userId,
      title: "3x täglich Stimmung notieren",
      description: "Morgens, mittags, abends kurz festhalten, wie es dir geht.",
      target_days: 7,
      completed_days: 5,
      active: true,
    },
    {
      user_id: userId,
      title: "Nach dem Essen kurz bewegen",
      description: "An mindestens 4 Tagen die Woche nach einer Mahlzeit ein paar Minuten spazieren.",
      target_days: 7,
      completed_days: 3,
      active: true,
    },
    {
      user_id: userId,
      title: "Weniger Druck beim Messen",
      description: "Werte als Daten sehen, nicht als Note – ohne Selbstvorwürfe.",
      target_days: 7,
      completed_days: 4,
      active: true,
    },
  ]

  return { insights, goals }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateSeedData(userId: string): SeedData {
  const rng = mulberry32(hashUserSeed(userId))
  const dates = studyDates()
  const plans = buildDayPlans(rng, dates)

  const data: SeedData = {
    entries: [],
    glucose: [],
    insulin: [],
    meals: [],
    mood: [],
    activity: [],
    conversations: [],
    messages: [],
    insights: [],
    goals: [],
    stats: {
      days: dates.length,
      totalEntries: 0,
      cgmReadings: 0,
      meals: 0,
      insulin: 0,
      moods: 0,
      activities: 0,
      hypoEvents: 0,
      conversations: 0,
    },
  }

  // Mood base follows a smooth random walk, nudged toward the monthly target.
  let baseMood = plans[0].moodTarget
  let badStreak = 0

  for (const plan of plans) {
    // Random walk + nudge toward the narrative target.
    baseMood += gauss(rng) * 0.35
    baseMood += (plan.moodTarget - baseMood) * 0.25
    // Cumulative burnout: several rough days in a row drag the baseline down.
    if (badStreak >= 3) baseMood -= 0.3
    baseMood = clamp(baseMood, 1, 5)

    const day = generateDay(userId, plan, baseMood, rng)

    data.entries.push(...day.entries)
    data.glucose.push(...day.glucose)
    data.insulin.push(...day.insulin)
    data.meals.push(...day.meals)
    data.mood.push(...day.mood)
    data.activity.push(...day.activity)
    if (day.hypoOccurred) data.stats.hypoEvents++

    // Track rough days for the burnout buildup.
    if (day.dayAvg > 180 || day.hypoOccurred) badStreak++
    else badStreak = 0
  }

  const { conversations, messages } = buildConversations(userId, dates)
  data.conversations = conversations
  data.messages = messages

  const { insights, goals } = buildInsightsAndGoals(userId)
  data.insights = insights
  data.goals = goals

  data.stats.totalEntries = data.entries.length
  data.stats.cgmReadings = data.glucose.length
  data.stats.meals = data.meals.length
  data.stats.insulin = data.insulin.length
  data.stats.moods = data.mood.length
  data.stats.activities = data.activity.length
  data.stats.conversations = data.conversations.length

  return data
}
