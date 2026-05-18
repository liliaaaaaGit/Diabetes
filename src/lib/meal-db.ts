import { supabaseServer as supabase } from "@/lib/supabase-server"
import type { CarbConfidence, MealEntry, MealInputSource, MealTemplate } from "@/lib/types"
import { normalizeComponents } from "@/lib/meal-carbs"
import { mealCarbsMidpoint } from "@/lib/meal-carbs"

const MEAL_SELECT =
  "entry_id,description,carbs_grams,kh_min,kh_max,confidence,components,fat_protein_note,extraction_note,user_corrected_kh,correction_timestamp,meal_type,linked_insulin_id,source,photo_url"

export function mapMealRow(m: Record<string, unknown>): Omit<MealEntry, keyof import("@/lib/types").BaseEntry | "type"> {
  return {
    description: (m.description as string) ?? "",
    carbsGrams: m.carbs_grams == null ? undefined : Number(m.carbs_grams),
    carbsMinGrams: m.kh_min == null ? undefined : Number(m.kh_min),
    carbsMaxGrams: m.kh_max == null ? undefined : Number(m.kh_max),
    carbsConfidence: (m.confidence as CarbConfidence) || undefined,
    components: normalizeComponents(m.components),
    fatProteinNote: (m.fat_protein_note as string) || undefined,
    extractionNote: (m.extraction_note as string) || undefined,
    userCorrectedKh: m.user_corrected_kh == null ? undefined : Number(m.user_corrected_kh),
    correctionTimestamp: m.correction_timestamp
      ? new Date(m.correction_timestamp as string).toISOString()
      : undefined,
    mealType: m.meal_type as MealEntry["mealType"],
    linkedInsulinEntryId: (m.linked_insulin_id as string) || undefined,
    mealSource: (m.source as MealInputSource) || undefined,
    photoUrl: (m.photo_url as string) || undefined,
  }
}

export function mealInsertRow(entryId: string, meal: Partial<MealEntry> & { mealType?: MealEntry["mealType"] }) {
  const min = meal.carbsMinGrams
  const max = meal.carbsMaxGrams
  const midpoint =
    meal.carbsGrams ??
    (min != null && max != null ? mealCarbsMidpoint({ carbsMinGrams: min, carbsMaxGrams: max, carbsGrams: undefined }) : undefined)

  return {
    entry_id: entryId,
    description: meal.description ?? "",
    carbs_grams: midpoint ?? null,
    kh_min: min ?? null,
    kh_max: max ?? null,
    confidence: meal.carbsConfidence ?? null,
    components: meal.components?.length ? meal.components : null,
    fat_protein_note: meal.fatProteinNote ?? null,
    extraction_note: meal.extractionNote ?? null,
    user_corrected_kh: meal.userCorrectedKh ?? null,
    correction_timestamp: meal.correctionTimestamp ?? null,
    meal_type: meal.mealType ?? "lunch",
    linked_insulin_id: meal.linkedInsulinEntryId ?? null,
    source: meal.mealSource ?? "manual",
    photo_url: meal.photoUrl ?? null,
  }
}

export async function updateMealCorrection(
  userId: string,
  entryId: string,
  correctedKh: number
): Promise<MealEntry> {
  const { data: base, error: baseErr } = await supabase
    .from("entries")
    .select("id,user_id,type")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle()
  if (baseErr) throw baseErr
  if (!base || base.type !== "meal") throw new Error("Not a meal entry")

  const now = new Date().toISOString()
  const { data: mealBefore } = await supabase
    .from("entry_meal")
    .select(MEAL_SELECT)
    .eq("entry_id", entryId)
    .maybeSingle()

  const { error } = await supabase
    .from("entry_meal")
    .update({
      user_corrected_kh: correctedKh,
      correction_timestamp: now,
      carbs_grams: correctedKh,
    })
    .eq("entry_id", entryId)
  if (error) throw error

  if (mealBefore) {
    await supabase.from("meal_correction_feedback").insert({
      user_id: userId,
      entry_id: entryId,
      description: mealBefore.description,
      kh_min: mealBefore.kh_min,
      kh_max: mealBefore.kh_max,
      corrected_kh: correctedKh,
    })
  }

  const { data: updated, error: readErr } = await supabase
    .from("entry_meal")
    .select(MEAL_SELECT)
    .eq("entry_id", entryId)
    .maybeSingle()
  if (readErr) throw readErr
  if (!updated) throw new Error("Meal row missing after update")

  const { data: common } = await supabase
    .from("entries")
    .select("id,user_id,timestamp,note,created_at,source,conversation_id")
    .eq("id", entryId)
    .single()

  return {
    id: entryId,
    userId: common!.user_id,
    type: "meal",
    timestamp: new Date(common!.timestamp).toISOString(),
    note: common!.note || undefined,
    createdAt: new Date(common!.created_at).toISOString(),
    source: common!.source as MealEntry["source"],
    conversationId: common!.conversation_id || undefined,
    ...mapMealRow(updated as Record<string, unknown>),
  } as MealEntry
}

export async function getMealTemplates(userId: string): Promise<MealTemplate[]> {
  const { data, error } = await supabase
    .from("meal_templates")
    .select("id,user_id,name,description,kh,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? "",
    kh: Number(r.kh),
    createdAt: new Date(r.created_at).toISOString(),
  }))
}

export async function createMealTemplate(
  userId: string,
  input: { name: string; description: string; kh: number }
): Promise<MealTemplate> {
  const { data, error } = await supabase
    .from("meal_templates")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description.trim(),
      kh: Math.round(input.kh),
    })
    .select("id,user_id,name,description,kh,created_at")
    .single()
  if (error) throw error
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description ?? "",
    kh: Number(data.kh),
    createdAt: new Date(data.created_at).toISOString(),
  }
}

export async function deleteMealTemplate(userId: string, templateId: string): Promise<void> {
  const { error } = await supabase
    .from("meal_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId)
  if (error) throw error
}

export { MEAL_SELECT }
