"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"

interface FilePreviewProps {
  file: File
  onMappingChange: (mapping: Record<string, string>) => void
}

function splitCsvLine(line: string, delim: string): string[] {
  return line.split(delim).map((c) => c.replace(/^"|"$/g, "").trim())
}

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) || []).length
  const semis = (line.match(/;/g) || []).length
  return semis > commas ? ";" : ","
}

export function FilePreview({ file, onMappingChange }: FilePreviewProps) {
  const { t } = useTranslation()
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [parseOk, setParseOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const slice = file.slice(0, Math.min(file.size, 80_000))
        const text = await slice.text()
        if (cancelled) return
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .slice(0, 6)
        if (lines.length === 0) {
          setColumns([])
          setRows([])
          setParseOk(false)
          return
        }
        const delim = detectDelimiter(lines[0])
        const header = splitCsvLine(lines[0], delim).filter((c) => c.length > 0)
        const body = lines.slice(1, 6).map((ln) => splitCsvLine(ln, delim))
        if (header.length === 0) {
          setColumns([])
          setRows([])
          setParseOk(false)
          return
        }
        setColumns(header)
        setRows(body)
        setParseOk(true)
      } catch {
        if (!cancelled) {
          setColumns([])
          setRows([])
          setParseOk(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])

  const handleMappingChange = (column: string, value: string) => {
    const newMapping = { ...mapping, [column]: value }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const mappingOptions = [
    { value: "timestamp", label: t("import.timestamp") },
    { value: "glucose", label: t("import.glucose") },
    { value: "insulin", label: t("import.insulin") },
    { value: "carbs", label: t("import.carbs") },
    { value: "ignore", label: t("import.ignore") },
  ]

  const exampleHeaders = [
    t("import.exampleHeaderDate"),
    t("import.exampleHeaderTime"),
    t("import.exampleHeaderValue"),
  ]
  const exampleRow = ["2024-01-15", "08:00", "120"]

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t("import.preview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parseOk ? (
          <p className="text-sm text-slate-600">{t("import.noColumnsParsed")}</p>
        ) : (
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">{t("import.columns")}</Label>
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-28 flex-shrink-0 truncate" title={column}>
                    {column}
                  </span>
                  <Select
                    value={mapping[column] || "ignore"}
                    onValueChange={(value) => handleMappingChange(column, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mappingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-xs font-medium text-slate-500 mb-2">{t("import.exampleCaption")}</p>
          <div className="overflow-x-auto rounded-lg border border-dashed border-slate-200 bg-slate-50/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {exampleHeaders.map((col) => (
                    <th key={col} className="text-left p-2 text-slate-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {exampleRow.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-2 text-slate-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {parseOk && rows.length > 0 ? (
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">{t("import.previewRowsHint")}</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {columns.map((col) => (
                      <th key={col} className="text-left p-2 text-slate-600">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {columns.map((_, cellIdx) => (
                        <td key={cellIdx} className="p-2 text-slate-700">
                          {row[cellIdx] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
