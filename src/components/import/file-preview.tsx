"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"

interface FilePreviewProps {
  file: File
  onMappingChange: (mapping: Record<string, string>) => void
}

export function FilePreview({ file, onMappingChange }: FilePreviewProps) {
  const { t } = useTranslation()
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Mock CSV parsing - in real app, parse the file
  const mockColumns = ["Datum", "Zeit", "Blutzucker", "Insulin", "KH"]
  const mockRows = [
    ["2024-01-15", "08:30", "95", "5", "45"],
    ["2024-01-15", "12:15", "142", "4", "60"],
    ["2024-01-15", "19:00", "128", "3", "55"],
    ["2024-01-16", "07:45", "88", "6", "50"],
    ["2024-01-16", "13:20", "165", "5", "70"],
  ]

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

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t("import.preview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-slate-600 mb-2 block">
            {t("import.columns")}
          </Label>
          <div className="space-y-2">
            {mockColumns.map((column) => (
              <div key={column} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 w-24 flex-shrink-0">
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

        <div className="border-t pt-4">
          <Label className="text-sm text-slate-600 mb-2 block">
            {t("import.preview")} (erste 5 Zeilen)
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {mockColumns.map((col) => (
                    <th key={col} className="text-left p-2 text-slate-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockRows.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-2 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
