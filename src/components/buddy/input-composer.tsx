"use client"

import { useState, KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface InputComposerProps {
  onSend: (text: string) => void
  isDisabled?: boolean
  onTypingChange?: (isTyping: boolean) => void
}

export function InputComposer({ onSend, isDisabled = false, onTypingChange }: InputComposerProps) {
  const { t } = useTranslation()
  const [text, setText] = useState("")

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
    <div className="border-t border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
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
          onClick={handleSend}
          disabled={!text.trim() || isDisabled}
          size="icon"
          className="h-11 w-11 flex-shrink-0 rounded-full bg-teal-500 hover:bg-teal-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
