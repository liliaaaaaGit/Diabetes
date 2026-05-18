"use client"

import { Camera, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"
import { usePhotoMealContext } from "@/components/logbook/photo-meal-context"
import { isMobileDevice } from "@/components/logbook/use-photo-meal-analysis"

interface PhotoMealInputProps {
  disabled?: boolean
}

/** Camera button for the logbook quick-input row. */
export function PhotoMealInput({ disabled = false }: PhotoMealInputProps) {
  const { t } = useTranslation()
  const photo = usePhotoMealContext()

  return (
    <>
      <input
        ref={photo.inputRef}
        type="file"
        accept="image/*"
        capture={isMobileDevice() ? "environment" : undefined}
        className="sr-only"
        aria-hidden
        onChange={(e) => void photo.handleFileChange(e)}
      />
      {!photo.hasPhotoFlow && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || photo.isAnalyzing}
          className="h-11 w-11 shrink-0 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50"
          aria-label={t("logbook.photoPickLabel")}
          onClick={photo.openPicker}
        >
          <Camera className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}

/** Preview + analyze + confirmation panels (full width below input row). */
export function PhotoMealPanels() {
  const { t } = useTranslation()
  const photo = usePhotoMealContext()

  if (!photo.previewUrl && !photo.extractedEntries) return null

  if (photo.extractedEntries) {
    return (
      <div className="col-span-full mt-1 space-y-2">
        {photo.photoWarning && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {photo.photoWarning}
          </p>
        )}
        <ExtractionConfirmation
          extractedEntries={photo.extractedEntries}
          aiMessage=""
          photoWarning={photo.photoWarning}
          mealSource="photo_ai"
          source="manual"
          onSaveEntry={photo.saveWithOptionalPhoto}
          onSaveResult={photo.onPhotoSaveResult}
          onDiscard={photo.resetPhoto}
        />
      </div>
    )
  }

  return (
    <div className="col-span-full mt-2 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-xs leading-snug text-slate-600">{t("logbook.photoDisclaimer")}</p>
      <div className="relative mx-auto max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.previewUrl!} alt="" className="w-full rounded-lg object-cover max-h-48" />
        <button
          type="button"
          className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
          aria-label={t("common.close")}
          onClick={photo.resetPhoto}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={photo.keepPhoto}
          onChange={(e) => photo.setKeepPhoto(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t("logbook.photoKeepCheckbox")}
      </label>
      <Button
        type="button"
        className="w-full min-h-[44px] bg-teal-600 hover:bg-teal-700"
        disabled={photo.isAnalyzing || !photo.compressedFile}
        onClick={() => void photo.handleAnalyze()}
      >
        {photo.isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
            {t("logbook.photoAnalyzing")}
          </>
        ) : (
          t("logbook.photoAnalyzeButton")
        )}
      </Button>
    </div>
  )
}
