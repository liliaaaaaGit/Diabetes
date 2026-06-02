"use client"

import { useRef, useState } from "react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { useUser } from "@/hooks/useUser"
import { compressMealImage } from "@/lib/compress-meal-image"
import type { PhotoAnalysisResult } from "@/lib/parse-photo-analysis"
import { photoAnalysisToExtractedEntry } from "@/lib/photo-to-extracted-entry"
import type { Entry, ExtractedEntry, NewEntry } from "@/lib/types"
import { createEntry } from "@/lib/db-client"

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function usePhotoMealAnalysis(
  onEntrySaved?: (dates?: string[], saved?: Entry[]) => void | Promise<void>
) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [photoWarning, setPhotoWarning] = useState<string | null>(null)
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[] | null>(null)
  /** Bumps on each successful analysis so confirmation UI remounts with fresh state. */
  const [confirmationKey, setConfirmationKey] = useState(0)

  const hasPhotoFlow = Boolean(previewUrl || extractedEntries)

  const resetPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCompressedFile(null)
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
      setConfirmationKey((k) => k + 1)
    } catch {
      toast({ title: t("logbook.photoAnalyzeFailed"), variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Photos are never stored in the app — we only use them transiently to
  // estimate carbs, then save a normal meal entry.
  const savePhotoMeal = async (entry: NewEntry) => {
    if (!userId) throw new Error("Not signed in")
    return await createEntry(userId, entry)
  }

  const onPhotoSaveResult = async ({
    saved,
    failed,
    dates,
    entries,
  }: {
    saved: number
    failed: number
    dates?: string[]
    entries: Entry[]
  }) => {
    if (saved > 0 && failed === 0) {
      resetPhoto()
      await onEntrySaved?.(dates, entries)
    }
  }

  return {
    inputRef,
    previewUrl,
    isAnalyzing,
    photoWarning,
    extractedEntries,
    confirmationKey,
    hasPhotoFlow,
    resetPhoto,
    openPicker,
    handleFileChange,
    handleAnalyze,
    savePhotoMeal,
    onPhotoSaveResult,
    compressedFile,
  }
}
