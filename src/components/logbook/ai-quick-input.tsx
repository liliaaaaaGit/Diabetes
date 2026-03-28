"use client"

import { useState, type KeyboardEvent } from "react"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"
import type { ExtractedEntry } from "@/lib/types"
import { createEntry } from "@/lib/db"
import { ExtractionConfirmation } from "@/components/logbook/extraction-confirmation"

interface AiQuickInputProps {
  onManualFallback: () => void
  isDisabled?: boolean
  onRefetch?: () => void
}

export function AiQuickInput({
  onManualFallback,
  isDisabled = false,
  onRefetch,
}: AiQuickInputProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { userId } = useUser()
  const [text, setText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[] | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const trimmed = text.trim()
      if (!trimmed) return
      void detectAndExtract(trimmed)
    }
  }

  const detectAndExtract = async (raw: string) => {
    const payloadText = raw.slice(0, 500)
    setIsExtracting(true)
    setEmptyMessage(null)
    setExtractedEntries(null)
    setAiMessage("")
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payloadText }),
      })
      if (!res.ok) {
        toast({
          title: t("logbook.aiAnalyzeFailed"),
          description: undefined,
          variant: "destructive",
        })
        return
      }

      const json = (await res.json()) as { entries: ExtractedEntry[]; message?: string }
      const entries = Array.isArray(json.entries) ? json.entries : []

      if (entries.length === 0) {
        setEmptyMessage(t("logbook.aiNoData"))
        return
      }

      setAiMessage(json.message ?? "")
      setExtractedEntries(entries.map((e) => ({ ...e, included: true })))
    } catch {
      toast({
        title: t("logbook.aiAnalyzeFailed"),
        description: undefined,
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDiscard = () => {
    setText("")
    setExtractedEntries(null)
    setEmptyMessage(null)
    setAiMessage("")
  }

  return (
    <div className="sticky top-16 z-20 bg-slate-50/90 backdrop-blur pt-3 pb-2 px-0">
      <div className="mx-auto max-w-3xl md:max-w-7xl px-0">
        <div
          className={cn(
            "bg-white rounded-2xl border border-teal-100 shadow-sm",
            "p-3 sm:p-4"
          )}
        >
          <div className="flex gap-3 items-start">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-teal-600" />
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("logbook.aiInput")}
              disabled={isDisabled || isExtracting}
              rows={1}
              className={cn(
                "flex-1 border-0 bg-transparent p-0 m-0",
                "min-h-[44px] max-h-[120px] resize-none"
              )}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = `${Math.min(
                  target.scrollHeight,
                  120
                )}px`
              }}
            />

            <Button
              onClick={() => {
                const trimmed = text.trim()
                if (!trimmed) return
                void detectAndExtract(trimmed)
              }}
              disabled={isDisabled || isExtracting || !text.trim()}
              size="icon"
              className={cn(
                "h-11 w-11 rounded-full flex-shrink-0",
                "bg-teal-500 text-white hover:bg-teal-600"
              )}
            >
              {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
            <span>{t("logbook.or")}</span>
            <button
              type="button"
              onClick={onManualFallback}
              className="text-blue-600 font-medium hover:underline"
            >
              {t("logbook.manualFallback")}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl md:max-w-7xl px-0 mt-3">
        {isExtracting && (
          <p className="text-xs text-slate-600 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("logbook.aiAnalyzing")}
          </p>
        )}

        {emptyMessage && !extractedEntries && !isExtracting && (
          <p className="text-xs text-slate-600 mt-2">{emptyMessage}</p>
        )}

        {extractedEntries && (
          <ExtractionConfirmation
            extractedEntries={extractedEntries}
            aiMessage={aiMessage}
            source="manual"
            onSaveEntry={async (entry) => {
              if (!userId) throw new Error("Not signed in")
              await createEntry(userId, entry)
            }}
            onSaveResult={({ saved, failed }) => {
              if (saved > 0) {
                onRefetch?.()
              }
              if (failed === 0 && saved > 0) {
                setText("")
                setExtractedEntries(null)
                setEmptyMessage(null)
                setAiMessage("")
              }
            }}
            onDiscard={handleDiscard}
          />
        )}
      </div>
    </div>
  )
}

