import type {
  Conversation,
  ConversationEmotions,
  ConversationTag,
  Entry,
  Goal,
  Insight,
  Message,
  NewEntry,
} from "@/lib/types"

async function callClientDb<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/client-db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = "Request failed"
    try {
      const json = (await res.json()) as { error?: string }
      if (json?.error) message = json.error
    } catch {
      // keep default message
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export function createEntry(_userId: string, entry: NewEntry | Entry): Promise<Entry> {
  return callClientDb<Entry>({ op: "createEntry", entry })
}

export function getConversations(_userId: string): Promise<Conversation[]> {
  return callClientDb<Conversation[]>({ op: "getConversations" })
}

export function getConversation(conversationId: string, _userId: string): Promise<Conversation> {
  return callClientDb<Conversation>({ op: "getConversation", conversationId })
}

export function createConversation(_userId: string): Promise<Conversation> {
  return callClientDb<Conversation>({ op: "createConversation" })
}

export async function endConversation(conversationId: string, _userId: string): Promise<void> {
  await callClientDb<{ ok: true }>({ op: "endConversation", conversationId })
}

export async function updateConversationSummary(
  conversationId: string,
  _userId: string,
  summary: string,
  tags: ConversationTag[],
  moodEmoji: string,
  title?: string,
  emotions?: ConversationEmotions | null
): Promise<void> {
  await callClientDb<{ ok: true }>({
    op: "updateConversationSummary",
    conversationId,
    summary,
    tags,
    moodEmoji,
    title,
    emotions,
  })
}

export async function cleanupEmptyConversations(_userId: string): Promise<number> {
  const result = await callClientDb<{ count: number }>({ op: "cleanupEmptyConversations" })
  return result.count
}

export async function deleteConversation(conversationId: string, _userId: string): Promise<void> {
  await callClientDb<{ ok: true }>({ op: "deleteConversation", conversationId })
}

export async function deleteConversationsWithoutUserMessages(_userId: string): Promise<number> {
  const result = await callClientDb<{ count: number }>({ op: "deleteConversationsWithoutUserMessages" })
  return result.count
}

export function searchConversations(_userId: string, query: string): Promise<Conversation[]> {
  return callClientDb<Conversation[]>({ op: "searchConversations", query })
}

export function getConversationStats(
  _userId: string
): Promise<{ total: number; thisMonth: number; avgLength: number }> {
  return callClientDb<{ total: number; thisMonth: number; avgLength: number }>({
    op: "getConversationStats",
  })
}

export function getEmotionAverages(_userId: string): Promise<ConversationEmotions | null> {
  return callClientDb<ConversationEmotions | null>({ op: "getEmotionAverages" })
}

export function addMessage(
  conversationId: string,
  role: Message["role"],
  content: string,
  _userId: string
): Promise<Message> {
  return callClientDb<Message>({ op: "addMessage", conversationId, role, content })
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
  _userId: string
): Promise<void> {
  await callClientDb<{ ok: true }>({ op: "updateConversationTitle", conversationId, title })
}

export async function updateGoalProgress(
  goalId: string,
  completedDays: number,
  _userId: string
): Promise<void> {
  await callClientDb<{ ok: true }>({ op: "updateGoalProgress", goalId, completedDays })
}

export function getGoals(_userId: string): Promise<Goal[]> {
  return callClientDb<Goal[]>({ op: "getGoals" })
}

export function getInsights(_userId: string): Promise<Insight[]> {
  return callClientDb<Insight[]>({ op: "getInsights" })
}
