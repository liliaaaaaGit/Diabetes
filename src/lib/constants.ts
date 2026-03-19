// Glucose ranges in mg/dL
export const GLUCOSE_RANGE = {
  min: 20,
  max: 600,
} as const

// Glucose ranges in mmol/L
export const GLUCOSE_RANGE_MMOL = {
  min: 1.1,
  max: 33.3,
} as const

// Target glucose range in mg/dL
export const TARGET_RANGE = {
  low: 70,
  high: 180,
} as const

// Insulin range in units
export const INSULIN_RANGE = {
  min: 0,
  max: 100,
} as const

// Carbohydrates range in grams
export const CARBS_RANGE = {
  min: 0,
  max: 500,
} as const

// Entry types
export const ENTRY_TYPES = ["glucose", "insulin", "meal", "activity", "mood"] as const
export type EntryType = (typeof ENTRY_TYPES)[number]

// Meal types
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const
export type MealType = (typeof MEAL_TYPES)[number]

// Glucose measurement contexts
export const GLUCOSE_CONTEXTS = ["fasting", "pre_meal", "post_meal", "bedtime", "other"] as const
export type GlucoseContext = (typeof GLUCOSE_CONTEXTS)[number]

// Insulin types
export const INSULIN_TYPES = ["rapid", "long_acting", "mixed", "other"] as const
export type InsulinType = (typeof INSULIN_TYPES)[number]

// Mood scale (1-5)
export const MOOD_SCALE = [1, 2, 3, 4, 5] as const
export type MoodScale = (typeof MOOD_SCALE)[number]

// App colors as Tailwind-compatible constants
export const COLORS = {
  glucose: "#3B82F6",    // Blue
  insulin: "#8B5CF6",    // Purple
  meal: "#F59E0B",       // Amber
  activity: "#10B981",   // Green
  mood: "#EC4899",       // Pink
} as const

// Hardcoded test user for MVP (no auth yet)
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"
