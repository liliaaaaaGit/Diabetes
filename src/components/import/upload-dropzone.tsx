"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  selectedFile?: File
}

export function UploadDropzone({
  onFileSelect,
  selectedFile,
}: UploadDropzoneProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Card
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
        isDragging
          ? "border-teal-500 bg-teal-50"
          : "border-slate-300 hover:border-slate-400"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
            }
          }}
        />
        {selectedFile ? (
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">
              {selectedFile.name}
            </p>
            <p className="text-sm text-slate-600">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">
              {t("import.dropzone")}
            </p>
            <p className="text-sm text-slate-500">{t("import.acceptedFormats")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
