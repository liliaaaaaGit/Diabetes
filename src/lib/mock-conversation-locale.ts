import type { Locale } from "@/i18n/config"
import type { Conversation, ConversationTag, Message } from "@/lib/types"
import { MOCK_CONVERSATIONS_EN, type MockConversationLocalePack } from "@/lib/mock-conversations-en"

export type { MockConversationLocalePack }

const EN_BY_DE_TITLE = new Map<string, MockConversationLocalePack>(
  MOCK_CONVERSATIONS_EN.map((p) => [p.deTitle, p])
)

/** German titles of seeded demo chats (DB stores these). */
export const MOCK_CONVERSATION_DE_TITLES = [...EN_BY_DE_TITLE.keys()]

export function getMockConversationEnPack(deTitle: string): MockConversationLocalePack | undefined {
  return EN_BY_DE_TITLE.get(deTitle.trim())
}

function localizeTags(tags: ConversationTag[] | undefined, pack: MockConversationLocalePack): ConversationTag[] {
  return pack.tags.length > 0 ? pack.tags : tags ?? []
}

/** Localize list metadata (title, summary, tags) — no message bodies. */
export function localizeConversationMeta<T extends Conversation>(conv: T, locale: Locale): T {
  if (locale !== "en") return conv
  const title = (conv.title || "").trim()
  const pack = getMockConversationEnPack(title)
  if (!pack) return conv
  return {
    ...conv,
    title: pack.title,
    summary: pack.summary ?? conv.summary,
    tags: localizeTags(conv.tags, pack),
  }
}

export function localizeConversationList(conversations: Conversation[], locale: Locale): Conversation[] {
  if (locale !== "en") return conversations
  return conversations.map((c) => localizeConversationMeta(c, locale))
}

/** Full thread including messages (by turn index). */
export function localizeConversationWithMessages(conv: Conversation, locale: Locale): Conversation {
  if (locale !== "en") return conv
  const pack = getMockConversationEnPack((conv.title || "").trim())
  if (!pack) return conv
  const meta = localizeConversationMeta(conv, locale)
  const messages = localizeMessages(conv.messages ?? [], pack)
  return { ...meta, messages }
}

export function localizeMessages(
  messages: Message[],
  packOrDeTitle: MockConversationLocalePack | string
): Message[] {
  const pack =
    typeof packOrDeTitle === "string" ? getMockConversationEnPack(packOrDeTitle) : packOrDeTitle
  if (!pack) return messages
  return messages.map((m, i) => {
    const turn = pack.turns[i]
    if (!turn || turn.role !== m.role) return m
    return { ...m, content: turn.text }
  })
}

export function localizeSummaryForLocale(
  entry: { title: string; summary: string; dateLabel: string },
  locale: Locale
): { title: string; summary: string; dateLabel: string } {
  if (locale !== "en") return entry
  const pack = getMockConversationEnPack(entry.title)
  if (!pack) return entry
  return { title: pack.title, summary: pack.summary, dateLabel: entry.dateLabel }
}
