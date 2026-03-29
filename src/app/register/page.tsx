"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import { Eye, EyeOff, Droplet } from "lucide-react"

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [pseudonym, setPseudonym] = useState("")
  const [pin, setPin] = useState("")
  const [pinConfirm, setPinConfirm] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [showPinConfirm, setShowPinConfirm] = useState(false)
  const [errors, setErrors] = useState<{ pseudonym?: string; pin?: string; pinConfirm?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const validatePseudonym = (value: string): string | undefined => {
    if (!value.trim()) return t("auth.pseudonymRequired")
    if (value.length < 3 || value.length > 20) return t("auth.pseudonymLength")
    if (!/^[a-zA-Z0-9]+$/.test(value)) return t("auth.pseudonymInvalid")
    return undefined
  }

  const validatePin = (value: string): string | undefined => {
    if (!value) return t("auth.pinRequired")
    if (value.length < 4 || value.length > 6) return t("auth.pinLength")
    if (!/^\d+$/.test(value)) return t("auth.pinDigitsOnly")
    return undefined
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const pseudonymError = validatePseudonym(pseudonym)
    const pinError = validatePin(pin)
    const pinConfirmError = pin !== pinConfirm ? t("auth.pinMismatch") : undefined

    if (pseudonymError || pinError || pinConfirmError) {
      setErrors({ pseudonym: pseudonymError, pin: pinError, pinConfirm: pinConfirmError })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pseudonym: pseudonym.trim(), pin }),
      })

      const data = (await res.json()) as { success: boolean; error?: string; userId?: string }

      if (data.success) {
        router.push("/")
        router.refresh()
      } else {
        if (data.error?.includes("bereits vergeben") || data.error?.includes("already taken")) {
          setErrors({ pseudonym: t("auth.pseudonymTaken") })
        } else {
          setErrors({ general: data.error || t("auth.registrationFailed") })
        }
      }
    } catch (err) {
      setErrors({ general: t("auth.connectionError") })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 text-white mb-4">
            <Droplet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("auth.registerTitle")}</h1>
          <p className="text-sm text-slate-600">{t("auth.registerSubtitle")}</p>
        </div>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

              <div>
                <Label htmlFor="pseudonym" className="mb-2">
                  {t("auth.pseudonymLabel")}
                </Label>
                <Input
                  id="pseudonym"
                  type="text"
                  value={pseudonym}
                  onChange={(e) => {
                    setPseudonym(e.target.value)
                    setErrors({ ...errors, pseudonym: undefined })
                  }}
                  placeholder={t("auth.pseudonymPlaceholder")}
                  disabled={loading}
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">{t("auth.pseudonymHelper")}</p>
                {errors.pseudonym && <p className="text-sm text-red-600 mt-1">{errors.pseudonym}</p>}
              </div>

              <div>
                <Label htmlFor="pin" className="mb-2">
                  {t("auth.pinLabel")}
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
                      setErrors({ ...errors, pin: undefined })
                    }}
                    placeholder={t("auth.pinPlaceholder")}
                    disabled={loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t("auth.pinHelper")}</p>
                {errors.pin && <p className="text-sm text-red-600 mt-1">{errors.pin}</p>}
              </div>

              <div>
                <Label htmlFor="pinConfirm" className="mb-2">
                  {t("auth.pinConfirmLabel")}
                </Label>
                <div className="relative">
                  <Input
                    id="pinConfirm"
                    type={showPinConfirm ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => {
                      setPinConfirm(e.target.value.replace(/\D/g, ""))
                      setErrors({ ...errors, pinConfirm: undefined })
                    }}
                    placeholder={t("auth.pinPlaceholder")}
                    disabled={loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinConfirm(!showPinConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPinConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.pinConfirm && <p className="text-sm text-red-600 mt-1">{errors.pinConfirm}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("common.loading") : t("auth.createAccount")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
