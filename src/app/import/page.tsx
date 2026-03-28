"use client"

import { useState } from "react"
import { AppShell } from "@/components/shared/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "@/components/import/upload-dropzone"
import { FilePreview } from "@/components/import/file-preview"
import { ImportSummary } from "@/components/import/import-summary"
import { EmptyState } from "@/components/shared/empty-state"
import { FileText } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"

export default function ImportPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
  } | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setImportResult(null)

    setIsImporting(false)

    toast({
      title: t("import.notAvailableTitle"),
      description: t("import.notAvailableDesc"),
    })
  }

  return (
    <AppShell title={t("pages.import")}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {t("import.title")}
          </h1>
          <p className="text-sm text-slate-600">{t("import.subtitle")}</p>
        </div>

        {/* Info Card */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-700 mb-2">{t("import.info")}</p>
            <p className="text-xs text-slate-600 italic">
              {t("import.prototypeNote")}
            </p>
          </CardContent>
        </Card>

        {/* Upload Dropzone */}
        {!selectedFile && (
          <UploadDropzone onFileSelect={handleFileSelect} />
        )}

        {/* File Preview */}
        {selectedFile && !importResult && (
          <div className="space-y-4">
            <UploadDropzone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
            <FilePreview file={selectedFile} onMappingChange={setMapping} />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(undefined)
                  setMapping({})
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? t("import.importing") : t("import.import")}
              </Button>
            </div>
          </div>
        )}

        {/* Import Summary */}
        {importResult && (
          <div className="space-y-4">
            <ImportSummary
              imported={importResult.imported}
              skipped={importResult.skipped}
            />
            <Button
              onClick={() => {
                setSelectedFile(undefined)
                setMapping({})
                setImportResult(null)
              }}
            >
              {t("common.close")}
            </Button>
          </div>
        )}

        {/* Empty State */}
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
