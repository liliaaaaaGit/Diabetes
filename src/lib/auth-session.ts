import { cookies } from "next/headers"

/** Server-only: reads httpOnly session cookie set at login. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  return store.get("gc_user_id")?.value ?? null
}
