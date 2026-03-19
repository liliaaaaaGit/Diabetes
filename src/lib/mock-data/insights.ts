import { Insight } from "@/lib/types"

const userId = "user-001"

function getTimestamp(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(10, 0, 0, 0)
  return date.toISOString()
}

export const mockInsights: Insight[] = [
  {
    id: "insight-001",
    userId,
    type: "pattern",
    title: "Postprandiale Werte nach Mittagessen",
    description: "Dein Blutzucker ist nach dem Mittagessen häufiger über 180 mg/dL als nach anderen Mahlzeiten.",
    category: "glucose",
    createdAt: getTimestamp(2),
    dismissed: false,
  },
  {
    id: "insight-002",
    userId,
    type: "stat",
    title: "Durchschnittlicher Blutzucker",
    description: "Dein durchschnittlicher Blutzucker diese Woche: 148 mg/dL",
    category: "glucose",
    createdAt: getTimestamp(1),
    dismissed: false,
  },
  {
    id: "insight-003",
    userId,
    type: "theme",
    title: "Thema: Frustration",
    description: "Du hast diese Woche 3x über Frustration mit postprandialen Werten gesprochen.",
    category: "mood",
    createdAt: getTimestamp(0),
    dismissed: false,
  },
  {
    id: "insight-004",
    userId,
    type: "stat",
    title: "Regelmäßiges Tracking",
    description: "Du hast diese Woche 28 Einträge gemacht – regelmäßiges Tracking!",
    category: "general",
    createdAt: getTimestamp(0),
    dismissed: false,
  },
  {
    id: "insight-005",
    userId,
    type: "pattern",
    title: "Bewegung und Abendwerte",
    description: "An Tagen mit Bewegung sind deine Abendwerte tendenziell niedriger.",
    category: "glucose",
    createdAt: getTimestamp(3),
    dismissed: false,
  },
]
