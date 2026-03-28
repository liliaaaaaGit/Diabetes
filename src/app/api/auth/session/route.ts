import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

/**
 * Returns the logged-in user from cookies (gc_user_id is httpOnly — not readable in the browser).
 */
export async function GET() {
  const store = await cookies()
  const userId = store.get("gc_user_id")?.value ?? null
  const pseudonym = store.get("gc_pseudonym")?.value ?? null
  return NextResponse.json({
    userId,
    pseudonym,
    isLoggedIn: Boolean(userId),
  })
}
