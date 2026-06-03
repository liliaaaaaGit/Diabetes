"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { Eye, EyeOff, Droplet } from "lucide-react"

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [pseudonym, setPseudonym] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pseudonym: pseudonym.trim(), pin }),
      })

      const data = (await res.json()) as { success: boolean; error?: string }

      if (data.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(data.error || t("auth.loginFailed"))
      }
    } catch (err) {
      setError(t("auth.connectionError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="absolute right-4 top-4 w-[5.5rem] sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white">
            <Droplet className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl">{t("auth.loginTitle")}</h1>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div>
                <Label htmlFor="pseudonym" className="mb-2">
                  {t("auth.loginPseudonymLabel")}
                </Label>
                <Input
                  id="pseudonym"
                  type="text"
                  value={pseudonym}
                  onChange={(e) => {
                    setPseudonym(e.target.value)
                    setError("")
                  }}
                  placeholder={t("auth.pseudonymPlaceholder")}
                  disabled={loading}
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="pin" className="mb-2">
                  {t("auth.loginPinLabel")}
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ""))
                      setError("")
                    }}
                    placeholder={t("auth.pinPlaceholder")}
                    disabled={loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading || !pseudonym.trim() || !pin} className="w-full">
                {loading ? t("common.loading") : t("auth.loginButton")}
              </Button>

              <div className="text-center pt-2">
                <Link href="/register" className="text-sm text-teal-600 hover:underline">
                  {t("auth.noAccountYet")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
