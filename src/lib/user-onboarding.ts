import { supabaseServer as supabase } from "@/lib/supabase-server"
import { setUserContext } from "@/lib/user-context"

export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("[user-onboarding] read failed:", error)
    throw error
  }

  return Boolean(data?.onboarding_completed)
}

export async function completeOnboarding(userId: string): Promise<void> {
  await setUserContext(userId)

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", userId)

  if (error) {
    console.error("[user-onboarding] update failed:", error)
    throw error
  }
}
