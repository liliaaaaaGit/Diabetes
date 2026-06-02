"use client"

import type { ComponentProps } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTranslation } from "@/hooks/useTranslation"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"

type ExtractionConfirmationModalProps = ComponentProps<typeof ExtractionConfirmation> & {
  open: boolean
  onClose: () => void
}

/**
 * Full-screen overlay for AI/photo extraction review — blocks background scroll
 * and keeps focus on confirm/discard (logbook + Gluco).
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
  const modalTitle = title ?? t("logbook.extractionDetectedEntries")

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

  return (
    <>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={(v) => !v && handleDiscard()} modal>
          <SheetContent
            side="bottom"
            className="flex max-h-[min(96dvh,100%)] flex-col gap-0 overflow-hidden rounded-t-2xl border-teal-100 bg-teal-50/95 px-4 pb-0 pt-5"
          >
            <SheetHeader className="shrink-0 text-left">
              <SheetTitle className="text-base">{modalTitle}</SheetTitle>
            </SheetHeader>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              {panel}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={(v) => !v && handleDiscard()} modal>
          <DialogContent className="flex max-h-[min(90dvh,900px)] max-w-2xl flex-col gap-0 overflow-hidden border-teal-100 bg-teal-50/95 p-0 sm:rounded-xl">
            <DialogHeader className="shrink-0 border-b border-teal-100/80 px-6 py-4 text-left">
              <DialogTitle className="text-base">{modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {panel}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
