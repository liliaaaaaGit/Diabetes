"use client"

import { useRef, useState } from "react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { useUser } from "@/hooks/useUser"
import { compressMealImage } from "@/lib/compress-meal-image"
import type { PhotoAnalysisResult } from "@/lib/parse-photo-analysis"
import { photoAnalysisToExtractedEntry } from "@/lib/photo-to-extracted-entry"
import type { ExtractedEntry, NewEntry } from "@/lib/types"
import { createEntry } from "@/lib/db-client"

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function usePhotoMealAnalysis(onRefetch?: () => void) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [keepPhoto, setKeepPhoto] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[] | null>(null)

  const hasPhotoFlow = Boolean(previewUrl || extractedEntries)

  const resetPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCompressedFile(null)
    setKeepPhoto(false)
    setPhotoWarning(null)
    setExtractedEntries(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const openPicker = () => inputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExtractedEntries(null)
    setPhotoWarning(null)
    try {
      const compressed = await compressMealImage(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setCompressedFile(compressed)
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch {
      toast({ title: t("logbook.photoCompressFailed"), variant: "destructive" })
    }
  }

  const handleAnalyze = async () => {
    if (!compressedFile) return
    setIsAnalyzing(true)
    setExtractedEntries(null)
    setPhotoWarning(null)
    try {
      const formData = new FormData()
      formData.append("image", compressedFile)
      const res = await fetch("/api/diary/analyze-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (res.status === 429) {
        toast({ title: t("logbook.photoRateLimited"), variant: "destructive" })
        return
      }
      if (!res.ok) {
        toast({ title: t("logbook.photoAnalyzeFailed"), variant: "destructive" })
        return
      }
      const json = (await res.json()) as PhotoAnalysisResult
      if (!json.is_food) {
        toast({ title: t("logbook.photoNotFood"), variant: "destructive" })
        return
      }
      const entry = photoAnalysisToExtractedEntry(json, format(new Date(), "yyyy-MM-dd"))
      if (!entry) {
        toast({ title: t("logbook.photoAnalyzeFailed"), variant: "destructive" })
        return
      }
      setPhotoWarning(json.warning ?? null)
      setExtractedEntries([entry])
    } catch {
      toast({ title: t("logbook.photoAnalyzeFailed"), variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveWithOptionalPhoto = async (entry: NewEntry) => {
    if (!userId) throw new Error("Not signed in")
    const saved = await createEntry(userId, entry)
    if (keepPhoto && compressedFile && saved.type === "meal") {
      const fd = new FormData()
      fd.append("image", compressedFile)
      await fetch(`/api/entries/${saved.id}/meal-photo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      })
    }
  }

  const onPhotoSaveResult = ({ saved, failed }: { saved: number; failed: number }) => {
    if (saved > 0 && failed === 0) {
      resetPhoto()
      onRefetch?.()
    }
  }

  return {
    inputRef,
    previewUrl,
    keepPhoto,
    setKeepPhoto,
    isAnalyzing,
    photoWarning,
    extractedEntries,
    hasPhotoFlow,
    resetPhoto,
    openPicker,
    handleFileChange,
    handleAnalyze,
    saveWithOptionalPhoto,
    onPhotoSaveResult,
    compressedFile,
  }
}
