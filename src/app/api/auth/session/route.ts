import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionUserId } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

/**
 * Returns the logged-in user from cookies (gc_user_id is httpOnly — not readable in the browser).
 */
export async function GET() {
  const store = await cookies()
  const userId = await getSessionUserId()
  const pseudonym = store.get("gc_pseudonym")?.value ?? null
  return NextResponse.json({
    userId,
    pseudonym,
    isLoggedIn: Boolean(userId),
  })
}
