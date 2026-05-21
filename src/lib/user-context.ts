import { supabaseServer as supabase } from "@/lib/supabase-server"

/** Sets Postgres session variable for RLS policies (requesting_user_id). */
export async function setUserContext(userId: string): Promise<void> {
  const { error } = await supabase.rpc("set_user_context", { user_id: userId })
  if (error) {
    console.warn("[user-context] set_user_context failed:", error.message)
  }
}
