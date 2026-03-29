export type EntryType = "glucose" | "insulin" | "meal" | "activity" | "mood"

export type GlucoseUnit = "mg_dl" | "mmol_l"

export type GlucoseContext = "fasting" | "pre_meal" | "post_meal" | "bedtime" | "other"

export type InsulinType = "rapid" | "long_acting" | "mixed" | "other"

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export type Intensity = "low" | "medium" | "high"

export type MoodValue = 1 | 2 | 3 | 4 | 5

export interface BaseEntry {
  id: string
  userId: string
  type: EntryType
  timestamp: string // ISO 8601
  note?: string
  createdAt: string
  source: "manual" | "conversation" | "import"
  // Used to link AI/Conversation-created entries to the originating conversation.
  // Optional for now (e.g. logbook AI quick input).
  conversationId?: string
}

export interface GlucoseEntry extends BaseEntry {
  type: "glucose"
  value: number
  unit: GlucoseUnit
  context: GlucoseContext
}

export interface InsulinEntry extends BaseEntry {
  type: "insulin"
  dose: number
  insulinType: InsulinType
  insulinName?: string // z.B. "NovoRapid", "Lantus"
}

export interface MealEntry extends BaseEntry {
  type: "meal"
  description: string
  carbsGrams?: number
  mealType: MealType
  linkedInsulinEntryId?: string
}

export interface ActivityEntry extends BaseEntry {
  type: "activity"
  activityType: string // z.B. "Spaziergang", "Radfahren"
  durationMinutes: number
  intensity: Intensity
}

export interface MoodEntry extends BaseEntry {
  type: "mood"
  moodValue: MoodValue
}

export type Entry = GlucoseEntry | InsulinEntry | MealEntry | ActivityEntry | MoodEntry

export interface ExtractedEntry {
  /** Explicit entry kind from the extraction API (preferred over guessing from data fields). */
  type?: EntryType
  sourceText: string
  data: Partial<GlucoseEntry | InsulinEntry | MealEntry | ActivityEntry | MoodEntry>
  confidence: number
  included: boolean
}

/** Theme tag stored with each summarized conversation (emoji + short label). */
export interface ConversationTag {
  emoji: string
  label: string
}

/** Six basic emotion intensities (0–1) for mood / radar visualizations. */
export interface ConversationEmotions {
  happiness: number
  surprise: number
  sadness: number
  anger: number
  fear: number
  disgust: number
}

export interface Conversation {
  id: string
  userId: string
  title?: string
  summary?: string
  dominantEmoji?: string
  messageCount?: number
  tags: ConversationTag[]
  emotions?: ConversationEmotions | null
  startedAt: string
  endedAt?: string
  isActive: boolean
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  suggestedEntry?: Partial<Entry> // Falls AI einen Log-Vorschlag erkennt
}

export interface Insight {
  id: string
  userId: string
  type: "pattern" | "stat" | "theme" | "goal" | "motivation"
  title: string
  description: string
  category: string // z.B. "glucose", "meals", "mood", "general"
  createdAt: string
  dismissed: boolean
}

export interface DashboardStats {
  avgGlucose: number
  unit: GlucoseUnit
  entriesToday: number
  timeInRange: number // Prozent 0-100
  lastGlucose?: {
    value: number
    timestamp: string
    context: GlucoseContext
  }
}

export interface Goal {
  id: string
  userId: string
  title: string
  description: string
  targetDays: number
  completedDays: number
  active: boolean
  createdAt: string
}

export interface NewGoal {
  userId: string
  title: string
  description: string
  targetDays?: number
  active?: boolean
}

// Entry creation input (no id / createdAt, userId is derived from the app's default user)
export type NewEntryBase = Omit<BaseEntry, "id" | "userId" | "createdAt">

export type NewEntry =
  | (Omit<GlucoseEntry, "id" | "userId" | "createdAt"> & {
      userId?: never
    })
  | (Omit<InsulinEntry, "id" | "userId" | "createdAt"> & {
      userId?: never
    })
  | (Omit<MealEntry, "id" | "userId" | "createdAt"> & {
      userId?: never
    })
  | (Omit<ActivityEntry, "id" | "userId" | "createdAt"> & {
      userId?: never
    })
  | (Omit<MoodEntry, "id" | "userId" | "createdAt"> & {
      userId?: never
    })
