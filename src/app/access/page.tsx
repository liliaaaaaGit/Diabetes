"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { Droplet } from "lucide-react"

export default function AccessPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      })

      const data = (await res.json()) as { success: boolean; error?: string }

      if (data.success) {
        router.push("/login")
        router.refresh()
      } else {
        setError(data.error || t("auth.invalidCode"))
      }
    } catch (err) {
      setError(t("auth.connectionError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-white mb-4">
            <Droplet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">GlucoCompanion</h1>
          <p className="text-sm text-slate-600">{t("auth.accessSubtitle")}</p>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
                  {t("auth.enterAccessCode")}
                </label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("auth.codePlaceholder")}
                  disabled={loading}
                  className="w-full"
                  autoFocus
                />
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>

              <Button type="submit" disabled={loading || !code.trim()} className="w-full">
                {loading ? t("common.loading") : t("auth.continue")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
