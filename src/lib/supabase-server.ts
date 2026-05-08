import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const serverKey = serviceRoleKey || anonKey

if (!supabaseUrl || !serverKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase server env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY fallback)."
  )
}

if (!serviceRoleKey && anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key for server client; RLS bypass is disabled."
  )
}

/**
 * Server-only client. Uses service role for API routes and DB layer.
 * Never import this file in client components.
 */
export const supabaseServer = createClient(
  supabaseUrl as string,
  serverKey as string
)

export function createServerClient() {
  return createClient(
    supabaseUrl as string,
    serverKey as string
  )
}

