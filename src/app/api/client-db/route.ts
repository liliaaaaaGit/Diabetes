import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import {
  addMessage,
  cleanupEmptyConversations,
  createConversation,
  createEntry,
  deleteConversation,
  deleteConversationsWithoutUserMessages,
  endConversation,
  getConversation,
  getConversationStats,
  getConversations,
  getEmotionAverages,
  getGoals,
  getInsights,
  searchConversations,
  updateConversationSummary,
  updateConversationTitle,
  updateGoalProgress,
} from "@/lib/db"
import type { ConversationEmotions, ConversationTag, Entry, Message, NewEntry } from "@/lib/types"

type ClientDbRequest =
  | { op: "createEntry"; entry: NewEntry | Entry }
  | { op: "getConversations" }
  | { op: "getConversation"; conversationId: string }
  | { op: "createConversation" }
  | { op: "endConversation"; conversationId: string }
  | {
      op: "updateConversationSummary"
      conversationId: string
      summary: string
      tags: ConversationTag[]
      moodEmoji: string
      title?: string
      emotions?: ConversationEmotions | null
    }
  | { op: "cleanupEmptyConversations" }
  | { op: "deleteConversation"; conversationId: string }
  | { op: "deleteConversationsWithoutUserMessages" }
  | { op: "searchConversations"; query: string }
  | { op: "getConversationStats" }
  | { op: "getEmotionAverages" }
  | { op: "addMessage"; conversationId: string; role: Message["role"]; content: string }
  | { op: "updateConversationTitle"; conversationId: string; title: string }
  | { op: "updateGoalProgress"; goalId: string; completedDays: number }
  | { op: "getGoals" }
  | { op: "getInsights" }

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: ClientDbRequest
  try {
    body = (await req.json()) as ClientDbRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    switch (body.op) {
      case "createEntry":
        return NextResponse.json(await createEntry(userId, body.entry))
      case "getConversations":
        return NextResponse.json(await getConversations(userId))
      case "getConversation":
        return NextResponse.json(await getConversation(body.conversationId, userId))
      case "createConversation":
        return NextResponse.json(await createConversation(userId))
      case "endConversation":
        await endConversation(body.conversationId, userId)
        return NextResponse.json({ ok: true })
      case "updateConversationSummary":
        await updateConversationSummary(
          body.conversationId,
          userId,
          body.summary,
          body.tags,
          body.moodEmoji,
          body.title,
          body.emotions
        )
        return NextResponse.json({ ok: true })
      case "cleanupEmptyConversations":
        return NextResponse.json({ count: await cleanupEmptyConversations(userId) })
      case "deleteConversation":
        await deleteConversation(body.conversationId, userId)
        return NextResponse.json({ ok: true })
      case "deleteConversationsWithoutUserMessages":
        return NextResponse.json({
          count: await deleteConversationsWithoutUserMessages(userId),
        })
      case "searchConversations":
        return NextResponse.json(await searchConversations(userId, body.query))
      case "getConversationStats":
        return NextResponse.json(await getConversationStats(userId))
      case "getEmotionAverages":
        return NextResponse.json(await getEmotionAverages(userId))
      case "addMessage":
        return NextResponse.json(
          await addMessage(body.conversationId, body.role, body.content, userId)
        )
      case "updateConversationTitle":
        await updateConversationTitle(body.conversationId, body.title, userId)
        return NextResponse.json({ ok: true })
      case "updateGoalProgress":
        await updateGoalProgress(body.goalId, body.completedDays, userId)
        return NextResponse.json({ ok: true })
      case "getGoals":
        return NextResponse.json(await getGoals(userId))
      case "getInsights":
        return NextResponse.json(await getInsights(userId))
      default:
        return NextResponse.json({ error: "Unsupported operation" }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "client-db operation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
