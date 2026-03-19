import {
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  ActivityEntry,
  MoodEntry,
  GlucoseContext,
  MoodValue,
} from "@/lib/types"

const userId = "user-001"

// Helper function to generate ISO timestamp
function getTimestamp(daysAgo: number, hours: number, minutes: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

// Helper function to generate ID
let entryCounter = 1
function getEntryId(): string {
  return `entry-${String(entryCounter++).padStart(3, "0")}`
}

// Generate entries for the last 14 days
export const mockEntries: Entry[] = []

// Day 0 (today)
mockEntries.push(
  // Glucose entries
  {
    id: getEntryId(),
    userId,
    type: "glucose",
    value: 95,
    unit: "mg_dl",
    context: "fasting",
    timestamp: getTimestamp(0, 7, 30),
    createdAt: getTimestamp(0, 7, 30),
    source: "manual",
  } as GlucoseEntry,
  {
    id: getEntryId(),
    userId,
    type: "glucose",
    value: 88,
    unit: "mg_dl",
    context: "pre_meal",
    timestamp: getTimestamp(0, 12, 0),
    createdAt: getTimestamp(0, 12, 0),
    source: "manual",
  } as GlucoseEntry,
  {
    id: getEntryId(),
    userId,
    type: "glucose",
    value: 165,
    unit: "mg_dl",
    context: "post_meal",
    timestamp: getTimestamp(0, 14, 30),
    createdAt: getTimestamp(0, 14, 30),
    source: "manual",
  } as GlucoseEntry,
  {
    id: getEntryId(),
    userId,
    type: "glucose",
    value: 142,
    unit: "mg_dl",
    context: "pre_meal",
    timestamp: getTimestamp(0, 19, 0),
    createdAt: getTimestamp(0, 19, 0),
    source: "manual",
  } as GlucoseEntry,
  {
    id: getEntryId(),
    userId,
    type: "glucose",
    value: 128,
    unit: "mg_dl",
    context: "bedtime",
    timestamp: getTimestamp(0, 22, 30),
    createdAt: getTimestamp(0, 22, 30),
    source: "manual",
  } as GlucoseEntry,
  // Insulin entries
  {
    id: getEntryId(),
    userId,
    type: "insulin",
    dose: 20,
    insulinType: "long_acting",
    insulinName: "Lantus",
    timestamp: getTimestamp(0, 22, 0),
    createdAt: getTimestamp(0, 22, 0),
    source: "manual",
  } as InsulinEntry,
  {
    id: getEntryId(),
    userId,
    type: "insulin",
    dose: 5,
    insulinType: "rapid",
    insulinName: "NovoRapid",
    timestamp: getTimestamp(0, 12, 5),
    createdAt: getTimestamp(0, 12, 5),
    source: "manual",
  } as InsulinEntry,
  {
    id: getEntryId(),
    userId,
    type: "insulin",
    dose: 4,
    insulinType: "rapid",
    insulinName: "NovoRapid",
    timestamp: getTimestamp(0, 19, 5),
    createdAt: getTimestamp(0, 19, 5),
    source: "manual",
  } as InsulinEntry,
  // Meal entries
  {
    id: getEntryId(),
    userId,
    type: "meal",
    description: "Vollkornbrötchen mit Käse und Tomate",
    carbsGrams: 45,
    mealType: "breakfast",
    timestamp: getTimestamp(0, 8, 0),
    createdAt: getTimestamp(0, 8, 0),
    source: "manual",
  } as MealEntry,
  {
    id: getEntryId(),
    userId,
    type: "meal",
    description: "Nudeln mit Pesto",
    carbsGrams: 60,
    mealType: "lunch",
    timestamp: getTimestamp(0, 12, 15),
    createdAt: getTimestamp(0, 12, 15),
    source: "manual",
  } as MealEntry,
  {
    id: getEntryId(),
    userId,
    type: "meal",
    description: "Lachs mit Reis und Brokkoli",
    carbsGrams: 55,
    mealType: "dinner",
    timestamp: getTimestamp(0, 19, 15),
    createdAt: getTimestamp(0, 19, 15),
    source: "manual",
  } as MealEntry,
  // Activity
  {
    id: getEntryId(),
    userId,
    type: "activity",
    activityType: "Spaziergang",
    durationMinutes: 30,
    intensity: "low",
    timestamp: getTimestamp(0, 16, 0),
    createdAt: getTimestamp(0, 16, 0),
    source: "manual",
  } as ActivityEntry,
  // Mood
  {
    id: getEntryId(),
    userId,
    type: "mood",
    moodValue: 4,
    timestamp: getTimestamp(0, 20, 0),
    createdAt: getTimestamp(0, 20, 0),
    source: "manual",
  } as MoodEntry
)

// Day 1 (yesterday)
mockEntries.push(
  { id: getEntryId(), userId, type: "glucose", value: 102, unit: "mg_dl", context: "fasting", timestamp: getTimestamp(1, 7, 15), createdAt: getTimestamp(1, 7, 15), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 92, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(1, 12, 30), createdAt: getTimestamp(1, 12, 30), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 178, unit: "mg_dl", context: "post_meal", timestamp: getTimestamp(1, 15, 0), createdAt: getTimestamp(1, 15, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 135, unit: "mg_dl", context: "bedtime", timestamp: getTimestamp(1, 22, 45), createdAt: getTimestamp(1, 22, 45), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 20, insulinType: "long_acting", insulinName: "Lantus", timestamp: getTimestamp(1, 22, 0), createdAt: getTimestamp(1, 22, 0), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 6, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(1, 12, 35), createdAt: getTimestamp(1, 12, 35), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 3, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(1, 19, 10), createdAt: getTimestamp(1, 19, 10), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "meal", description: "Haferflocken mit Beeren", carbsGrams: 50, mealType: "breakfast", timestamp: getTimestamp(1, 8, 30), createdAt: getTimestamp(1, 8, 30), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Pasta mit Gemüsesauce", carbsGrams: 75, mealType: "lunch", timestamp: getTimestamp(1, 12, 45), createdAt: getTimestamp(1, 12, 45), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Hähnchenbrust mit Kartoffeln", carbsGrams: 40, mealType: "dinner", timestamp: getTimestamp(1, 19, 20), createdAt: getTimestamp(1, 19, 20), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "mood", moodValue: 3, timestamp: getTimestamp(1, 21, 0), createdAt: getTimestamp(1, 21, 0), source: "manual" } as MoodEntry
)

// Day 2
mockEntries.push(
  { id: getEntryId(), userId, type: "glucose", value: 88, unit: "mg_dl", context: "fasting", timestamp: getTimestamp(2, 7, 45), createdAt: getTimestamp(2, 7, 45), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 95, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(2, 12, 15), createdAt: getTimestamp(2, 12, 15), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 152, unit: "mg_dl", context: "post_meal", timestamp: getTimestamp(2, 14, 45), createdAt: getTimestamp(2, 14, 45), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 118, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(2, 18, 30), createdAt: getTimestamp(2, 18, 30), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 145, unit: "mg_dl", context: "bedtime", timestamp: getTimestamp(2, 23, 0), createdAt: getTimestamp(2, 23, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 20, insulinType: "long_acting", insulinName: "Lantus", timestamp: getTimestamp(2, 22, 30), createdAt: getTimestamp(2, 22, 30), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 4, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(2, 12, 20), createdAt: getTimestamp(2, 12, 20), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 5, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(2, 18, 35), createdAt: getTimestamp(2, 18, 35), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "meal", description: "Müsli mit Joghurt", carbsGrams: 55, mealType: "breakfast", timestamp: getTimestamp(2, 8, 15), createdAt: getTimestamp(2, 8, 15), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Salat mit Hähnchen", carbsGrams: 25, mealType: "lunch", timestamp: getTimestamp(2, 12, 30), createdAt: getTimestamp(2, 12, 30), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Pizza Margherita", carbsGrams: 70, mealType: "dinner", timestamp: getTimestamp(2, 18, 45), createdAt: getTimestamp(2, 18, 45), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "activity", activityType: "Radfahren", durationMinutes: 45, intensity: "medium", timestamp: getTimestamp(2, 16, 0), createdAt: getTimestamp(2, 16, 0), source: "manual" } as ActivityEntry,
  { id: getEntryId(), userId, type: "mood", moodValue: 4, timestamp: getTimestamp(2, 20, 30), createdAt: getTimestamp(2, 20, 30), source: "manual" } as MoodEntry
)

// Day 3
mockEntries.push(
  { id: getEntryId(), userId, type: "glucose", value: 105, unit: "mg_dl", context: "fasting", timestamp: getTimestamp(3, 7, 0), createdAt: getTimestamp(3, 7, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 98, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(3, 12, 45), createdAt: getTimestamp(3, 12, 45), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 195, unit: "mg_dl", context: "post_meal", timestamp: getTimestamp(3, 15, 15), createdAt: getTimestamp(3, 15, 15), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 125, unit: "mg_dl", context: "bedtime", timestamp: getTimestamp(3, 22, 15), createdAt: getTimestamp(3, 22, 15), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 20, insulinType: "long_acting", insulinName: "Lantus", timestamp: getTimestamp(3, 22, 0), createdAt: getTimestamp(3, 22, 0), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 7, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(3, 12, 50), createdAt: getTimestamp(3, 12, 50), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 4, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(3, 19, 0), createdAt: getTimestamp(3, 19, 0), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "meal", description: "Toast mit Avocado", carbsGrams: 35, mealType: "breakfast", timestamp: getTimestamp(3, 8, 0), createdAt: getTimestamp(3, 8, 0), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Reis mit Gemüsecurry", carbsGrams: 65, mealType: "lunch", timestamp: getTimestamp(3, 13, 0), createdAt: getTimestamp(3, 13, 0), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Quinoa-Salat", carbsGrams: 50, mealType: "dinner", timestamp: getTimestamp(3, 19, 15), createdAt: getTimestamp(3, 19, 15), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "mood", moodValue: 2, timestamp: getTimestamp(3, 21, 0), createdAt: getTimestamp(3, 21, 0), source: "manual" } as MoodEntry
)

// Day 4
mockEntries.push(
  { id: getEntryId(), userId, type: "glucose", value: 92, unit: "mg_dl", context: "fasting", timestamp: getTimestamp(4, 7, 30), createdAt: getTimestamp(4, 7, 30), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 85, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(4, 12, 0), createdAt: getTimestamp(4, 12, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 148, unit: "mg_dl", context: "post_meal", timestamp: getTimestamp(4, 14, 0), createdAt: getTimestamp(4, 14, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 112, unit: "mg_dl", context: "pre_meal", timestamp: getTimestamp(4, 19, 30), createdAt: getTimestamp(4, 19, 30), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "glucose", value: 132, unit: "mg_dl", context: "bedtime", timestamp: getTimestamp(4, 22, 0), createdAt: getTimestamp(4, 22, 0), source: "manual" } as GlucoseEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 19, insulinType: "long_acting", insulinName: "Lantus", timestamp: getTimestamp(4, 22, 0), createdAt: getTimestamp(4, 22, 0), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 3, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(4, 12, 5), createdAt: getTimestamp(4, 12, 5), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "insulin", dose: 4, insulinType: "rapid", insulinName: "NovoRapid", timestamp: getTimestamp(4, 19, 35), createdAt: getTimestamp(4, 19, 35), source: "manual" } as InsulinEntry,
  { id: getEntryId(), userId, type: "meal", description: "Rührei mit Vollkornbrot", carbsGrams: 30, mealType: "breakfast", timestamp: getTimestamp(4, 8, 15), createdAt: getTimestamp(4, 8, 15), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Wrap mit Hähnchen", carbsGrams: 55, mealType: "lunch", timestamp: getTimestamp(4, 12, 15), createdAt: getTimestamp(4, 12, 15), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "meal", description: "Fisch mit Kartoffeln", carbsGrams: 45, mealType: "dinner", timestamp: getTimestamp(4, 19, 45), createdAt: getTimestamp(4, 19, 45), source: "manual" } as MealEntry,
  { id: getEntryId(), userId, type: "activity", activityType: "Yoga", durationMinutes: 20, intensity: "low", timestamp: getTimestamp(4, 17, 0), createdAt: getTimestamp(4, 17, 0), source: "manual" } as ActivityEntry,
  { id: getEntryId(), userId, type: "mood", moodValue: 4, timestamp: getTimestamp(4, 20, 0), createdAt: getTimestamp(4, 20, 0), source: "manual" } as MoodEntry
)

// Continue with days 5-13 (abbreviated for space, but following same pattern)
// I'll create a more compact version for the remaining days

const generateDayEntries = (daysAgo: number, glucoseValues: number[], insulinDoses: number[], meals: Array<{desc: string, carbs: number, type: "breakfast" | "lunch" | "dinner" | "snack"}>, activities?: Array<{type: string, duration: number, intensity: "low" | "medium" | "high"}>, mood: MoodValue = 3) => {
  const entries: Entry[] = []
  const times = [
    { hour: 7, min: 30, context: "fasting" as GlucoseContext },
    { hour: 12, min: 0, context: "pre_meal" as GlucoseContext },
    { hour: 14, min: 30, context: "post_meal" as GlucoseContext },
    { hour: 19, min: 0, context: "pre_meal" as GlucoseContext },
    { hour: 22, min: 30, context: "bedtime" as GlucoseContext },
  ]
  
  // Glucose entries
  glucoseValues.forEach((value, idx) => {
    if (idx < times.length) {
      entries.push({
        id: getEntryId(),
        userId,
        type: "glucose",
        value,
        unit: "mg_dl",
        context: times[idx].context,
        timestamp: getTimestamp(daysAgo, times[idx].hour, times[idx].min),
        createdAt: getTimestamp(daysAgo, times[idx].hour, times[idx].min),
        source: "manual",
      } as GlucoseEntry)
    }
  })
  
  // Long-acting insulin (evening)
  entries.push({
    id: getEntryId(),
    userId,
    type: "insulin",
    dose: insulinDoses[0],
    insulinType: "long_acting",
    insulinName: "Lantus",
    timestamp: getTimestamp(daysAgo, 22, 0),
    createdAt: getTimestamp(daysAgo, 22, 0),
    source: "manual",
  } as InsulinEntry)
  
  // Rapid insulin (lunch and dinner)
  entries.push({
    id: getEntryId(),
    userId,
    type: "insulin",
    dose: insulinDoses[1],
    insulinType: "rapid",
    insulinName: "NovoRapid",
    timestamp: getTimestamp(daysAgo, 12, 5),
    createdAt: getTimestamp(daysAgo, 12, 5),
    source: "manual",
  } as InsulinEntry)
  
  if (insulinDoses[2]) {
    entries.push({
      id: getEntryId(),
      userId,
      type: "insulin",
      dose: insulinDoses[2],
      insulinType: "rapid",
      insulinName: "NovoRapid",
      timestamp: getTimestamp(daysAgo, 19, 5),
      createdAt: getTimestamp(daysAgo, 19, 5),
      source: "manual",
    } as InsulinEntry)
  }
  
  // Meals
  meals.forEach((meal, idx) => {
    const mealTimes = [
      { hour: 8, min: 0 },
      { hour: 12, min: 15 },
      { hour: 19, min: 15 },
      { hour: 15, min: 30 }, // snack
    ]
    const time = mealTimes[idx] || mealTimes[0]
    entries.push({
      id: getEntryId(),
      userId,
      type: "meal",
      description: meal.desc,
      carbsGrams: meal.carbs,
      mealType: meal.type,
      timestamp: getTimestamp(daysAgo, time.hour, time.min),
      createdAt: getTimestamp(daysAgo, time.hour, time.min),
      source: "manual",
    } as MealEntry)
  })
  
  // Activities
  if (activities) {
    activities.forEach(activity => {
      entries.push({
        id: getEntryId(),
        userId,
        type: "activity",
        activityType: activity.type,
        durationMinutes: activity.duration,
        intensity: activity.intensity,
        timestamp: getTimestamp(daysAgo, 16, 0),
        createdAt: getTimestamp(daysAgo, 16, 0),
        source: "manual",
      } as ActivityEntry)
    })
  }
  
  // Mood
  entries.push({
    id: getEntryId(),
    userId,
    type: "mood",
    moodValue: mood,
    timestamp: getTimestamp(daysAgo, 20, 0),
    createdAt: getTimestamp(daysAgo, 20, 0),
    source: "manual",
  } as MoodEntry)
  
  return entries
}

// Day 5
mockEntries.push(...generateDayEntries(5,
  [98, 90, 162, 120, 138],
  [20, 5, 4],
  [
    { desc: "Müsli mit Banane", carbs: 60, type: "breakfast" },
    { desc: "Burger mit Pommes", carbs: 80, type: "lunch" },
    { desc: "Gemüsepfanne", carbs: 40, type: "dinner" },
  ],
  [{ type: "Spaziergang", duration: 25, intensity: "low" }],
  3
))

// Day 6
mockEntries.push(...generateDayEntries(6,
  [110, 105, 188, 125, 150],
  [20, 6, 5],
  [
    { desc: "Porridge mit Nüssen", carbs: 50, type: "breakfast" },
    { desc: "Sushi", carbs: 70, type: "lunch" },
    { desc: "Hähnchen mit Reis", carbs: 55, type: "dinner" },
  ],
  [],
  4
))

// Day 7
mockEntries.push(...generateDayEntries(7,
  [85, 88, 155, 115, 125],
  [19, 4, 3],
  [
    { desc: "Vollkornbrötchen mit Frischkäse", carbs: 40, type: "breakfast" },
    { desc: "Pasta Carbonara", carbs: 75, type: "lunch" },
    { desc: "Lachs mit Gemüse", carbs: 30, type: "dinner" },
  ],
  [{ type: "Radfahren", duration: 60, intensity: "medium" }],
  5
))

// Day 8
mockEntries.push(...generateDayEntries(8,
  [95, 92, 175, 118, 142],
  [20, 5, 4],
  [
    { desc: "Toast mit Marmelade", carbs: 45, type: "breakfast" },
    { desc: "Salat mit Feta", carbs: 20, type: "lunch" },
    { desc: "Pizza", carbs: 75, type: "dinner" },
    { desc: "Apfel", carbs: 15, type: "snack" },
  ],
  [],
  3
))

// Day 9
mockEntries.push(...generateDayEntries(9,
  [102, 98, 168, 122, 135],
  [20, 6, 5],
  [
    { desc: "Haferflocken", carbs: 55, type: "breakfast" },
    { desc: "Sandwich", carbs: 50, type: "lunch" },
    { desc: "Risotto", carbs: 65, type: "dinner" },
  ],
  [{ type: "Yoga", duration: 30, intensity: "low" }],
  4
))

// Day 10
mockEntries.push(...generateDayEntries(10,
  [88, 85, 148, 110, 128],
  [19, 4, 4],
  [
    { desc: "Rührei mit Brot", carbs: 35, type: "breakfast" },
    { desc: "Wrap", carbs: 55, type: "lunch" },
    { desc: "Fisch mit Kartoffeln", carbs: 45, type: "dinner" },
  ],
  [{ type: "Spaziergang", duration: 40, intensity: "low" }],
  4
))

// Day 11
mockEntries.push(...generateDayEntries(11,
  [105, 100, 192, 130, 155],
  [20, 7, 5],
  [
    { desc: "Müsli", carbs: 60, type: "breakfast" },
    { desc: "Pasta", carbs: 80, type: "lunch" },
    { desc: "Quinoa-Bowl", carbs: 50, type: "dinner" },
  ],
  [],
  2
))

// Day 12
mockEntries.push(...generateDayEntries(12,
  [92, 88, 158, 118, 140],
  [20, 5, 4],
  [
    { desc: "Toast mit Avocado", carbs: 40, type: "breakfast" },
    { desc: "Salat", carbs: 25, type: "lunch" },
    { desc: "Hähnchen mit Reis", carbs: 55, type: "dinner" },
  ],
  [{ type: "Radfahren", duration: 45, intensity: "medium" }],
  4
))

// Day 13
mockEntries.push(...generateDayEntries(13,
  [98, 95, 165, 120, 132],
  [20, 5, 4],
  [
    { desc: "Porridge", carbs: 50, type: "breakfast" },
    { desc: "Burrito", carbs: 70, type: "lunch" },
    { desc: "Gemüsepfanne", carbs: 40, type: "dinner" },
  ],
  [],
  3
))

// Sort all entries by timestamp
mockEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
