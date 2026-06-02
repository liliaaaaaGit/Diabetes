"use client"

import { useState, KeyboardEvent } from "react"
import { Send, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { useRef } from "react"

interface InputComposerProps {
  onSend: (text: string) => void
  isDisabled?: boolean
  onTypingChange?: (isTyping: boolean) => void
  onEndConversation?: () => void
  onImageSelected?: (file: File) => void
  isEndingConversation?: boolean
}

export function InputComposer({
  onSend,
  isDisabled = false,
  onTypingChange,
  onEndConversation,
  onImageSelected,
  isEndingConversation = false,
}: InputComposerProps) {
  const { t } = useTranslation()
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
    <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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

      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onEndConversation}
          disabled={isDisabled || isEndingConversation || !onEndConversation}
          className="h-11 min-h-[44px] flex-shrink-0 rounded-full px-3 text-slate-700"
        >
          <X className="mr-1 h-4 w-4" />
          Gespräch beenden
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
            "resize-none min-h-[44px] max-h-[120px] rounded-full px-4 py-3",
            "focus-visible:ring-2 focus-visible:ring-teal-500"
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
          className="h-11 min-h-[44px] w-11 min-w-[44px] flex-shrink-0 rounded-full"
          aria-label="Bild hochladen oder Foto machen"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleSend}
          disabled={!text.trim() || isDisabled}
          size="icon"
          className="h-11 min-h-[44px] w-11 min-w-[44px] flex-shrink-0 rounded-full bg-teal-500 hover:bg-teal-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
