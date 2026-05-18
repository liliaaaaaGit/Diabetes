import { supabaseServer as supabase } from "@/lib/supabase-server"

const BUCKET = "meal_photos"

export async function uploadMealPhoto(
  userId: string,
  entryId: string,
  file: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg"
  const path = `${userId}/${entryId}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: true,
  })
  if (uploadError) throw uploadError

  const photoRef = `meal_photos/${path}`

  const { error: updateError } = await supabase
    .from("entry_meal")
    .update({ photo_url: photoRef })
    .eq("entry_id", entryId)

  if (updateError) throw updateError

  return photoRef
}

export async function verifyMealEntryOwner(
  userId: string,
  entryId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", userId)
    .eq("type", "meal")
    .maybeSingle()
  if (error) throw error
  return Boolean(data?.id)
}
