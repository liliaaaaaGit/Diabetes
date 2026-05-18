import { NextRequest, NextResponse } from "next/server"
import { getQuestionnaireAnalysisRows } from "@/lib/questionnaire"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ]
  return lines.join("\n")
}

export async function GET(req: NextRequest) {
  const token = process.env.ADMIN_EXPORT_TOKEN
  if (!token) {
    return NextResponse.json({ error: "export_not_configured" }, { status: 503 })
  }

  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!bearer || bearer !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const rows = await getQuestionnaireAnalysisRows()
    const csv = rowsToCsv(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="questionnaire_analysis.csv"',
      },
    })
  } catch (e) {
    console.error("[api/admin/questionnaire/export.csv]:", e)
    return NextResponse.json({ error: "export_failed" }, { status: 500 })
  }
}
