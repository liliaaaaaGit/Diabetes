import { supabaseServer as supabase } from "@/lib/supabase-server"
import { TARGET_RANGE } from "@/lib/constants"
import type { GlucoseUnit } from "@/lib/types"

export interface UserSettings {
  preferredUnit: GlucoseUnit
  targetMinMgDl: number
  targetMaxMgDl: number
}

const DEFAULTS: UserSettings = {
  preferredUnit: "mg_dl",
  targetMinMgDl: TARGET_RANGE.low,
  targetMaxMgDl: TARGET_RANGE.high,
}

function rowToSettings(row: {
  preferred_unit: string
  target_min_mg_dl: number
  target_max_mg_dl: number
}): UserSettings {
  const unit = row.preferred_unit === "mmol_l" ? "mmol_l" : "mg_dl"
  return {
    preferredUnit: unit,
    targetMinMgDl: Number(row.target_min_mg_dl) || DEFAULTS.targetMinMgDl,
    targetMaxMgDl: Number(row.target_max_mg_dl) || DEFAULTS.targetMaxMgDl,
  }
}

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  const { data: existing, error } = await supabase
    .from("user_settings")
    .select("preferred_unit, target_min_mg_dl, target_max_mg_dl")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[user-settings] load failed:", error)
    throw error
  }

  if (existing) {
    return rowToSettings(existing)
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("preferred_unit")
    .eq("id", userId)
    .maybeSingle()

  const preferredUnit: GlucoseUnit =
    userRow?.preferred_unit === "mmol_l" ? "mmol_l" : "mg_dl"

  const { data: inserted, error: insertError } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      preferred_unit: preferredUnit,
      target_min_mg_dl: DEFAULTS.targetMinMgDl,
      target_max_mg_dl: DEFAULTS.targetMaxMgDl,
    })
    .select("preferred_unit, target_min_mg_dl, target_max_mg_dl")
    .single()

  if (insertError) {
    console.error("[user-settings] insert failed:", insertError)
    throw insertError
  }

  return rowToSettings(inserted)
}

export async function updateUserSettings(
  userId: string,
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  await getOrCreateUserSettings(userId)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.preferredUnit != null) {
    updates.preferred_unit = patch.preferredUnit
  }
  if (patch.targetMinMgDl != null) {
    updates.target_min_mg_dl = patch.targetMinMgDl
  }
  if (patch.targetMaxMgDl != null) {
    updates.target_max_mg_dl = patch.targetMaxMgDl
  }

  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select("preferred_unit, target_min_mg_dl, target_max_mg_dl")
    .single()

  if (error) {
    console.error("[user-settings] update failed:", error)
    throw error
  }

  if (patch.preferredUnit != null) {
    await supabase.from("users").update({ preferred_unit: patch.preferredUnit }).eq("id", userId)
  }

  return rowToSettings(data)
}
