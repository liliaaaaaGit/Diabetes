import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase server env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  )
}

/**
 * Server-only client. Uses service role for API routes and DB layer.
 * Never import this file in client components.
 */
export const supabaseServer = createClient(
  supabaseUrl as string,
  serviceRoleKey as string
)

export function createServerClient() {
  return createClient(
    supabaseUrl as string,
    serviceRoleKey as string
  )
}

