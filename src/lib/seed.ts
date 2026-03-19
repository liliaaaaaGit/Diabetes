import { DEFAULT_USER_ID } from "@/lib/constants"
import { supabase } from "@/lib/supabase"
import {
  createEntry,
  createConversation,
  addMessage,
  createInsight,
  createGoal,
  updateGoalProgress,
  updateConversationSummary,
} from "@/lib/db"
import { mockEntries, mockConversations, mockInsights } from "@/lib/mock-data"

const seedGoals = [
  {
    title: "Achte diese Woche darauf, wie du dich nach Mahlzeiten fühlst",
    description: "Notiere kurz, wie es dir nach dem Essen gerade geht.",
    completedDays: 3,
    targetDays: 7,
  },
  {
    title: "Mache jeden Abend einen kurzen Reflexionseintrag",
    description: "Schreib 1–2 Sätze: Was lief gut, was beschäftigt dich?",
    completedDays: 5,
    targetDays: 7,
  },
]

export async function seedTestData(): Promise<void> {
  // Remove old data for the default user before inserting
  await supabase.from("conversations").delete().eq("user_id", DEFAULT_USER_ID)
  await supabase.from("entries").delete().eq("user_id", DEFAULT_USER_ID)
  await supabase.from("insights").delete().eq("user_id", DEFAULT_USER_ID)
  await supabase.from("goals").delete().eq("user_id", DEFAULT_USER_ID)

  // Entries
  for (const entry of mockEntries) {
    // createEntry ignores entry.id/userId and always uses the hardcoded test user
    // eslint-disable-next-line no-await-in-loop
    await createEntry(entry)
  }

  // Conversations + messages
  const conversationIdMap: Record<string, string> = {}
  for (const c of mockConversations) {
    // eslint-disable-next-line no-await-in-loop
    const created = await createConversation(DEFAULT_USER_ID)
    conversationIdMap[c.id] = created.id

    // Seed conversation title/summary metadata (used by UI)
    await supabase
      .from("conversations")
      .update({
        title: c.title || null,
        started_at: c.startedAt,
        ended_at: c.endedAt || null,
        is_active: c.isActive,
      })
      .eq("id", created.id)

    // eslint-disable-next-line no-await-in-loop
    for (const m of c.messages) {
      // eslint-disable-next-line no-await-in-loop
      await addMessage(created.id, m.role, m.content)
    }

    await updateConversationSummary(
      created.id,
      c.summary || "",
      c.tags || [],
      c.dominantEmoji || "💬"
    )
  }

  // Insights
  for (const i of mockInsights) {
    // eslint-disable-next-line no-await-in-loop
    const created = await createInsight({
      userId: DEFAULT_USER_ID,
      type: i.type,
      title: i.title,
      description: i.description,
      category: i.category,
    })

    // Keep mock timeline in UI (createdAt drives date filtering)
    await supabase
      .from("insights")
      .update({ created_at: i.createdAt })
      .eq("id", created.id)
  }

  // Goals
  for (const g of seedGoals) {
    // eslint-disable-next-line no-await-in-loop
    const created = await createGoal({
      userId: DEFAULT_USER_ID,
      title: g.title,
      description: g.description,
      targetDays: g.targetDays,
      active: true,
    })
    // eslint-disable-next-line no-await-in-loop
    await updateGoalProgress(created.id, g.completedDays)
  }
}

