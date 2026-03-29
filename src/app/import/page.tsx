"use client"

import { useState, useCallback } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "@/components/import/upload-dropzone"
import { FilePreview } from "@/components/import/file-preview"
import { ImportSummary, type ImportSummaryStats } from "@/components/import/import-summary"
import { EmptyState } from "@/components/shared/empty-state"
import { FileText } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import {
  type CsvColumnRole,
  type CsvParsed,
  buildAutoMapping,
  buildImportPayloads,
  mappingSupportsTimestamp,
  parseCsvFile,
  CSV_IMPORT_MAX_BYTES,
} from "@/lib/csv-import"

const IMPORT_BATCH = 40

export default function ImportPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [parsed, setParsed] = useState<CsvParsed | null>(null)
  const [mapping, setMapping] = useState<Record<string, CsvColumnRole>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResult, setImportResult] = useState<ImportSummaryStats | null>(null)
  const [parsingFile, setParsingFile] = useState(false)

  const loadFile = useCallback(
    async (file: File) => {
      setSelectedFile(file)
      setImportResult(null)
      setParsed(null)
      setMapping({})
      setParsingFile(true)

      if (file.size > CSV_IMPORT_MAX_BYTES) {
        toast({
          title: t("import.fileTooLargeTitle"),
          description: t("import.fileTooLarge"),
          variant: "destructive",
        })
        setSelectedFile(undefined)
        setParsingFile(false)
        return
      }

      const data = await parseCsvFile(file)
      if (!data || data.columns.length === 0) {
        toast({
          title: t("import.parseErrorTitle"),
          description: t("import.parseError"),
          variant: "destructive",
        })
        setSelectedFile(undefined)
        setParsingFile(false)
        return
      }

      setParsed(data)
      setMapping(buildAutoMapping(data.columns))
      setParsingFile(false)
    },
    [t, toast]
  )

  const handleFileSelect = (file: File) => {
    void loadFile(file)
  }

  const handleImport = async () => {
    if (!parsed || !mappingSupportsTimestamp(mapping)) {
      toast({
        title: t("import.mappingInvalidTitle"),
        description: t("import.mappingInvalidDesc"),
        variant: "destructive",
      })
      return
    }

    const payloads = buildImportPayloads(parsed.columns, parsed.rows, mapping)
    const preSkipped = parsed.rows.length - payloads.length

    if (payloads.length === 0) {
      toast({
        title: t("import.nothingToImportTitle"),
        description: t("import.nothingToImportDesc"),
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)
    setImportProgress({ current: 0, total: payloads.length })

    let glucose = 0
    let insulin = 0
    let meal = 0
    let apiSkipped = 0

    try {
      for (let i = 0; i < payloads.length; i += IMPORT_BATCH) {
        const chunk = payloads.slice(i, i + IMPORT_BATCH)
        const res = await fetch("/api/import/csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: chunk }),
        })

        if (res.status === 401) {
          toast({
            title: t("import.unauthorizedTitle"),
            description: t("import.unauthorizedImport"),
            variant: "destructive",
          })
          setIsImporting(false)
          return
        }

        if (!res.ok) {
          toast({
            title: t("import.importErrorTitle"),
            description: t("import.importError"),
            variant: "destructive",
          })
          setIsImporting(false)
          return
        }

        const json = (await res.json()) as {
          glucose: number
          insulin: number
          meal: number
          rowErrors: number
          totalEntries: number
        }

        glucose += json.glucose
        insulin += json.insulin
        meal += json.meal
        apiSkipped += json.rowErrors

        setImportProgress({
          current: Math.min(i + chunk.length, payloads.length),
          total: payloads.length,
        })
      }

      const totalEntries = glucose + insulin + meal
      setImportResult({
        totalEntries,
        glucose,
        insulin,
        meal,
        skippedRows: preSkipped + apiSkipped,
      })
      setSelectedFile(undefined)
      setParsed(null)
      setMapping({})
    } catch {
      toast({
        title: t("import.importErrorTitle"),
        description: t("import.importError"),
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setImportProgress({ current: 0, total: 0 })
    }
  }

  const previewRows = parsed ? parsed.rows.slice(0, 5) : []
  const canImport =
    !!parsed && mappingSupportsTimestamp(mapping) && !isImporting && parsed.rows.length > 0

  return (
    <AppShell title={t("pages.import")}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{t("import.title")}</h1>
          <p className="text-sm text-slate-600">{t("import.subtitle")}</p>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm bg-teal-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-700 mb-2">{t("import.info")}</p>
            <p className="text-xs text-slate-600">{t("import.importHelpNote")}</p>
          </CardContent>
        </Card>

        {!selectedFile && !importResult && !parsingFile && (
          <UploadDropzone onFileSelect={handleFileSelect} />
        )}

        {selectedFile && parsingFile && !importResult ? (
          <div className="space-y-4">
            <UploadDropzone onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            <p className="text-sm text-slate-600">{t("common.loading")}</p>
          </div>
        ) : null}

        {selectedFile && parsed && !importResult && (
          <div className="space-y-4">
            <UploadDropzone onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            <FilePreview
              columns={parsed.columns}
              previewRows={previewRows}
              mapping={mapping}
              onMappingChange={setMapping}
            />

            {isImporting && importProgress.total > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    {t("import.progressLabel", {
                      current: importProgress.current,
                      total: importProgress.total,
                    })}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(undefined)
                  setParsed(null)
                  setMapping({})
                }}
                disabled={isImporting}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={() => void handleImport()} disabled={!canImport}>
                {isImporting ? t("import.importing") : t("import.import")}
              </Button>
            </div>
          </div>
        )}

        {importResult && (
          <div className="space-y-4">
            <ImportSummary stats={importResult} />
            <Button
              onClick={() => {
                setImportResult(null)
              }}
            >
              {t("common.close")}
            </Button>
          </div>
        )}

        {!selectedFile && !importResult && (
          <EmptyState
            icon={FileText}
            title={t("empty.noFile")}
            description={t("empty.noFileDesc")}
          />
        )}
      </div>
    </AppShell>
  )
}
