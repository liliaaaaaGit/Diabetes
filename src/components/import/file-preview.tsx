"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import type { CsvColumnRole } from "@/lib/csv-import"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  columns: string[]
  /** First up to 5 data rows for the preview table */
  previewRows: string[][]
  mapping: Record<string, CsvColumnRole>
  onMappingChange: (mapping: Record<string, CsvColumnRole>) => void
}

export function FilePreview({
  columns,
  previewRows,
  mapping,
  onMappingChange,
}: FilePreviewProps) {
  const { t } = useTranslation()

  const handleMappingChange = (column: string, value: CsvColumnRole) => {
    onMappingChange({ ...mapping, [column]: value })
  }

  const mappingOptions: { value: CsvColumnRole; label: string }[] = [
    { value: "timestamp_date", label: t("import.timestampDate") },
    { value: "timestamp_time", label: t("import.timestampTime") },
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

  const parseOk = columns.length > 0

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
                    value={mapping[column] ?? "ignore"}
                    onValueChange={(value) => handleMappingChange(column, value as CsvColumnRole)}
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

        {parseOk && previewRows.length > 0 ? (
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">{t("import.previewTableTitle")}</Label>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {columns.map((col) => {
                      const role = mapping[col] ?? "ignore"
                      const ignored = role === "ignore"
                      return (
                        <th
                          key={col}
                          className={cn(
                            "text-left p-2 font-medium",
                            ignored ? "text-slate-400" : "text-slate-700"
                          )}
                        >
                          {col}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      {columns.map((col, cellIdx) => {
                        const role = mapping[col] ?? "ignore"
                        const ignored = role === "ignore"
                        return (
                          <td
                            key={col}
                            className={cn(
                              "p-2",
                              ignored ? "text-slate-400 bg-slate-50/80" : "text-slate-800"
                            )}
                          >
                            {row[cellIdx] ?? "—"}
                          </td>
                        )
                      })}
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
