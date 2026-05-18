import { supabaseServer as supabase } from "@/lib/supabase-server"

export const PHOTO_ANALYSIS_DAILY_LIMIT = 30

function startOfUtcDayIso(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function countPhotoAnalysesToday(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("photo_analysis_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfUtcDayIso())

  if (error) throw error
  return count ?? 0
}

export async function recordPhotoAnalysis(userId: string): Promise<void> {
  const { error } = await supabase.from("photo_analysis_log").insert({ user_id: userId })
  if (error) throw error
}

export async function assertPhotoAnalysisAllowed(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
}> {
  const used = await countPhotoAnalysesToday(userId)
  return {
    allowed: used < PHOTO_ANALYSIS_DAILY_LIMIT,
    used,
    limit: PHOTO_ANALYSIS_DAILY_LIMIT,
  }
}
