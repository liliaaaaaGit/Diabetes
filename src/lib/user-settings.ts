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

function parseUnit(raw: string | null | undefined): GlucoseUnit {
  if (raw === "mmol_l" || raw === "mmol/L") return "mmol_l"
  return "mg_dl"
}

function rowToSettings(row: {
  preferred_unit: string | null
  target_min_mg_dl?: number | null
  target_max_mg_dl?: number | null
}): UserSettings {
  return {
    preferredUnit: parseUnit(row.preferred_unit),
    targetMinMgDl: Number(row.target_min_mg_dl) || DEFAULTS.targetMinMgDl,
    targetMaxMgDl: Number(row.target_max_mg_dl) || DEFAULTS.targetMaxMgDl,
  }
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = error.code ?? ""
  const msg = (error.message ?? "").toLowerCase()
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("user_settings") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  )
}

async function readFromUsersTable(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("users")
    .select("preferred_unit")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("[user-settings] users fallback read failed:", error)
    throw error
  }

  return {
    preferredUnit: parseUnit(data?.preferred_unit),
    targetMinMgDl: DEFAULTS.targetMinMgDl,
    targetMaxMgDl: DEFAULTS.targetMaxMgDl,
  }
}

async function writePreferredUnitToUsers(userId: string, unit: GlucoseUnit): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ preferred_unit: unit })
    .eq("id", userId)

  if (error) {
    console.error("[user-settings] users preferred_unit update failed:", error)
    throw error
  }
}

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  const { data: existing, error } = await supabase
    .from("user_settings")
    .select("preferred_unit, target_min_mg_dl, target_max_mg_dl")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      console.warn("[user-settings] user_settings missing, using users table")
      return readFromUsersTable(userId)
    }
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

  const preferredUnit = parseUnit(userRow?.preferred_unit)

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
    if (isMissingTableError(insertError)) {
      return readFromUsersTable(userId)
    }
    console.error("[user-settings] insert failed:", insertError)
    throw insertError
  }

  return rowToSettings(inserted)
}

export async function updateUserSettings(
  userId: string,
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  const hasUnit = patch.preferredUnit != null
  const hasTarget =
    patch.targetMinMgDl != null || patch.targetMaxMgDl != null

  if (!hasUnit && !hasTarget) {
    return getOrCreateUserSettings(userId)
  }

  if (hasUnit) {
    await writePreferredUnitToUsers(userId, patch.preferredUnit!)
  }

  let settingsRow: UserSettings | null = null

  try {
    await getOrCreateUserSettings(userId)

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (hasUnit) {
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
      if (isMissingTableError(error)) {
        settingsRow = null
      } else {
        console.error("[user-settings] update failed:", error)
        throw error
      }
    } else if (data) {
      settingsRow = rowToSettings(data)
    }
  } catch (e) {
    const err = e as { code?: string; message?: string }
    if (!isMissingTableError(err)) {
      throw e
    }
    console.warn("[user-settings] user_settings update skipped, users table used for unit")
  }

  if (settingsRow) {
    return settingsRow
  }

  return readFromUsersTable(userId)
}
