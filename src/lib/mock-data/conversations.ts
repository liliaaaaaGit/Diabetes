import { Conversation, Message } from "@/lib/types"

const userId = "user-001"

function getTimestamp(daysAgo: number, hours: number, minutes: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

// Conversation 1 (vor 3 Tagen)
const conversation1Messages: Message[] = [
  {
    id: "msg-001",
    conversationId: "conv-001",
    role: "user",
    content: "Was bedeutet eigentlich Time in Range?",
    timestamp: getTimestamp(3, 10, 30),
  },
  {
    id: "msg-002",
    conversationId: "conv-001",
    role: "assistant",
    content: "Time in Range beschreibt den Prozentsatz der Zeit, in der dein Blutzucker innerhalb deines Zielbereichs liegt, typischerweise zwischen 70 und 180 mg/dL. Es ist ein hilfreicher Überblick über dein Glukosemanagement über einen bestimmten Zeitraum. Möchtest du mehr darüber erfahren?",
    timestamp: getTimestamp(3, 10, 31),
  },
  {
    id: "msg-003",
    conversationId: "conv-001",
    role: "user",
    content: "Ja, wie hoch sollte er sein?",
    timestamp: getTimestamp(3, 10, 35),
  },
  {
    id: "msg-004",
    conversationId: "conv-001",
    role: "assistant",
    content: "Viele Diabetes-Fachleute orientieren sich an einem Zielwert von über 70% innerhalb des Bereichs, aber das ist individuell verschieden. Es ist wichtig, das mit deinem Behandlungsteam zu besprechen, da sie deinen persönlichen Zielwert festlegen können. Wie erlebst du das aktuell?",
    timestamp: getTimestamp(3, 10, 36),
  },
]

export const conversation1: Conversation = {
  id: "conv-001",
  userId,
  title: "Time in Range",
  summary: "Frage zu Time in Range und Zielwerten",
  dominantEmoji: "⏱️",
  tags: ["glucose", "time-in-range", "zielwerte"],
  startedAt: getTimestamp(3, 10, 30),
  endedAt: getTimestamp(3, 10, 40),
  isActive: false,
  messages: conversation1Messages,
}

// Conversation 2 (gestern)
const conversation2Messages: Message[] = [
  {
    id: "msg-005",
    conversationId: "conv-002",
    role: "user",
    content: "Ich bin frustriert. Meine Werte nach dem Mittagessen sind immer zu hoch.",
    timestamp: getTimestamp(1, 15, 20),
  },
  {
    id: "msg-006",
    conversationId: "conv-002",
    role: "assistant",
    content: "Das klingt belastend. Schwankungen nach dem Essen sind ein häufiges Thema. Hast du bemerkt, ob es bei bestimmten Mahlzeiten schlimmer ist als bei anderen?",
    timestamp: getTimestamp(1, 15, 21),
  },
  {
    id: "msg-007",
    conversationId: "conv-002",
    role: "user",
    content: "Ja, besonders bei Pasta oder Brot.",
    timestamp: getTimestamp(1, 15, 25),
  },
  {
    id: "msg-008",
    conversationId: "conv-002",
    role: "assistant",
    content: "Kohlenhydratreiche Mahlzeiten wie Pasta und Brot können den Blutzucker stärker beeinflussen. Manche Menschen experimentieren mit der Reihenfolge des Essens oder dem Timing des Insulins – aber solche Anpassungen solltest du immer mit deinem Behandlungsteam besprechen. Wie geht es dir emotional damit?",
    timestamp: getTimestamp(1, 15, 26),
  },
  {
    id: "msg-009",
    conversationId: "conv-002",
    role: "user",
    content: "Manchmal fühle ich mich einfach überfordert.",
    timestamp: getTimestamp(1, 15, 30),
  },
  {
    id: "msg-010",
    conversationId: "conv-002",
    role: "assistant",
    content: "Das ist eine große Aufgabe, und es ist normal, sich manchmal erschöpft zu fühlen. Es kann helfen, solche Gefühle bewusst wahrzunehmen. Möchtest du darüber sprechen, was dir in solchen Momenten hilft?",
    timestamp: getTimestamp(1, 15, 31),
  },
]

export const conversation2: Conversation = {
  id: "conv-002",
  userId,
  title: "Frustration mit postprandialen Werten",
  summary: "Gespräch über hohe Werte nach dem Mittagessen und emotionale Belastung",
  dominantEmoji: "😞",
  tags: ["glucose", "mahlzeiten", "emotionen", "frustration"],
  startedAt: getTimestamp(1, 15, 20),
  endedAt: getTimestamp(1, 15, 35),
  isActive: false,
  messages: conversation2Messages,
}

// Conversation 3 (heute)
const conversation3Messages: Message[] = [
  {
    id: "msg-011",
    conversationId: "conv-003",
    role: "user",
    content: "Ich habe gerade Mittag gegessen, Nudeln mit Pesto, circa 60g Kohlenhydrate, und 5 Einheiten NovoRapid genommen.",
    timestamp: getTimestamp(0, 12, 30),
  },
  {
    id: "msg-012",
    conversationId: "conv-003",
    role: "assistant",
    content: "Danke fürs Teilen! Ich habe bemerkt, dass du einige Daten erwähnt hast. Soll ich die als Einträge für dein Tagebuch vorschlagen?",
    timestamp: getTimestamp(0, 12, 31),
    suggestedEntry: {
      type: "meal",
      description: "Nudeln mit Pesto",
      carbsGrams: 60,
      mealType: "lunch",
      timestamp: getTimestamp(0, 12, 15),
      source: "conversation",
    },
  },
]

export const conversation3: Conversation = {
  id: "conv-003",
  userId,
  title: "Mittagessen Eintrag",
  summary: "Eintrag für Mittagessen mit Nudeln und Pesto",
  dominantEmoji: "🍝",
  tags: ["mahlzeit", "eintrag"],
  startedAt: getTimestamp(0, 12, 30),
  isActive: true,
  messages: conversation3Messages,
}

export const mockConversations: Conversation[] = [
  conversation1,
  conversation2,
  conversation3,
]
