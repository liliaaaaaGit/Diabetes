"use client"

import { useState, KeyboardEvent, useRef } from "react"
import { Send, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { useVisualViewportInset } from "@/hooks/use-visual-viewport-inset"
import { cn } from "@/lib/utils"

interface InputComposerProps {
  onSend: (text: string) => void
  isDisabled?: boolean
  onTypingChange?: (isTyping: boolean) => void
  onEndConversation?: () => void
  onImageSelected?: (file: File) => void
  isEndingConversation?: boolean
  /** Pin to viewport bottom on mobile (ChatGPT-style chat). */
  fixedToViewport?: boolean
}

export function InputComposer({
  onSend,
  isDisabled = false,
  onTypingChange,
  onEndConversation,
  onImageSelected,
  isEndingConversation = false,
  fixedToViewport = false,
}: InputComposerProps) {
  const { t } = useTranslation()
  const keyboardInset = useVisualViewportInset()
  const [text, setText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (text.trim() && !isDisabled) {
      onSend(text.trim())
      setText("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm",
        "px-3 pt-2 sm:px-4 sm:py-3",
        fixedToViewport
          ? "fixed inset-x-0 bottom-0 z-40 md:static md:z-auto"
          : "sticky bottom-0 z-20"
      )}
      style={{
        paddingBottom: fixedToViewport
          ? `calc(${12 + keyboardInset}px + env(safe-area-inset-bottom))`
          : "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onImageSelected) onImageSelected(file)
          e.currentTarget.value = ""
        }}
      />

      {/* Mobile: X · wide field · photo · send — Desktop: text "Gespräch beenden" */}
      <div className="mx-auto flex w-full max-w-4xl items-center gap-1.5 sm:items-end sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onEndConversation}
          disabled={isDisabled || isEndingConversation || !onEndConversation}
          className={cn(
            "h-9 w-9 shrink-0 rounded-full p-0 text-slate-700",
            "sm:h-11 sm:min-h-[44px] sm:w-auto sm:rounded-full sm:px-3"
          )}
          aria-label={t("buddy.endChatButton")}
        >
          <X className="h-4 w-4 shrink-0" />
          <span className="ml-1 hidden sm:inline">{t("buddy.endChatButton")}</span>
        </Button>

        <Textarea
          value={text}
          onChange={(e) => {
            const next = e.target.value
            setText(next)
            onTypingChange?.(next.trim().length > 0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("buddy.placeholder")}
          disabled={isDisabled}
          rows={1}
          className={cn(
            "min-h-[44px] min-w-0 flex-1 resize-none rounded-full px-4 text-base leading-normal",
            "py-2.5 max-h-[120px] focus-visible:ring-2 focus-visible:ring-teal-500 sm:text-sm sm:py-3"
          )}
          style={{
            height: "auto",
            minHeight: "44px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "auto"
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`
          }}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full sm:h-11 sm:w-11"
          aria-label="Bild hochladen oder Foto machen"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleSend}
          disabled={!text.trim() || isDisabled}
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full bg-teal-500 hover:bg-teal-600 sm:h-11 sm:w-11"
          aria-label="Senden"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
