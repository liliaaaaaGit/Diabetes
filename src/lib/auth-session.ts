import { cookies } from "next/headers"

const UUID_V4_OR_GENERIC_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Server-only: reads httpOnly session cookie set at login. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get("gc_user_id")?.value ?? null
  if (!raw) return null
  return UUID_V4_OR_GENERIC_REGEX.test(raw) ? raw : null
}
