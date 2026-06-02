"use client"

import { useEffect, useState, type ComponentProps } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/useTranslation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { shouldPreventRadixOverlayDismiss } from "@/lib/radix-overlay-guards"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"
import { Button } from "@/components/ui/button"

type ExtractionConfirmationModalProps = ComponentProps<typeof ExtractionConfirmation> & {
  open: boolean
  onClose: () => void
}

const desktopOverlayGuardProps = {
  onPointerDownOutside: (e: Event) => {
    if (shouldPreventRadixOverlayDismiss(e)) e.preventDefault()
  },
  onInteractOutside: (e: Event) => {
    if (shouldPreventRadixOverlayDismiss(e)) e.preventDefault()
  },
}

/**
 * Full-screen overlay for AI/photo extraction review.
 * Mobile: plain fixed portal (no Radix Sheet — avoids iOS focus/pointer bugs).
 * Desktop: centered Radix Dialog.
 */
export function ExtractionConfirmationModal({
  open,
  onClose,
  onDiscard,
  onSaveResult,
  title,
  ...confirmationProps
}: ExtractionConfirmationModalProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [mounted, setMounted] = useState(false)
  const modalTitle = title ?? t("logbook.extractionDetectedEntries")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !mounted) return null

  const handleDiscard = () => {
    onDiscard()
    onClose()
  }

  const handleSaveResult: NonNullable<ComponentProps<typeof ExtractionConfirmation>["onSaveResult"]> = (
    result
  ) => {
    onSaveResult?.(result)
    if (result.saved > 0 && result.failed === 0) {
      onClose()
    }
  }

  const panel = (
    <ExtractionConfirmation
      {...confirmationProps}
      embedded
      title={modalTitle}
      onDiscard={handleDiscard}
      onSaveResult={handleSaveResult}
    />
  )

  if (isMobile) {
    return createPortal(
      <div
        className="extraction-modal-root fixed inset-0 z-[110] flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extraction-modal-title"
      >
        {/* Dimmed area only — sheet below stays fully tappable (no full-screen overlay on top). */}
        <button
          type="button"
          className="min-h-0 flex-1 w-full bg-black/60 touch-manipulation"
          aria-label={t("common.close")}
          onClick={handleDiscard}
        />
        <div className="relative flex max-h-[min(96dvh,100%)] w-full shrink-0 flex-col overflow-hidden rounded-t-2xl border border-teal-100 bg-teal-50/95 shadow-xl touch-manipulation">
          <div className="flex shrink-0 items-center justify-between border-b border-teal-100/80 px-4 py-3">
            <h2 id="extraction-modal-title" className="text-base font-semibold text-slate-900">
              {modalTitle}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleDiscard}
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
            {panel}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) handleDiscard()
      }}
      modal
    >
      <DialogContent
        className="extraction-modal-root flex max-h-[min(90dvh,900px)] max-w-2xl flex-col gap-0 overflow-hidden border-teal-100 bg-teal-50/95 p-0 sm:rounded-xl"
        {...desktopOverlayGuardProps}
      >
        <DialogHeader className="shrink-0 border-b border-teal-100/80 px-6 py-4 text-left">
          <DialogTitle className="text-base">{modalTitle}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {panel}
        </div>
      </DialogContent>
    </Dialog>
  )
}
