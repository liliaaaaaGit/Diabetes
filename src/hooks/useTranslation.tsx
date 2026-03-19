"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Locale, defaultLocale } from "@/i18n/config"
import deTranslations from "@/i18n/de.json"
import enTranslations from "@/i18n/en.json"

type Translations = typeof deTranslations

const translations: Record<Locale, Translations> = {
  de: deTranslations,
  en: enTranslations,
}

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Load locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("locale") as Locale | null
      if (savedLocale && (savedLocale === "de" || savedLocale === "en")) {
        setLocaleState(savedLocale)
      }
    }
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale)
    }
  }

  // Function to get nested translation value
  const t = (key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split(".")
    let value: any = translations[locale]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        // Fallback to default locale if key not found
        value = translations[defaultLocale]
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }

    const resolved = typeof value === "string" ? value : key

    if (typeof resolved === "string" && vars) {
      return resolved.replace(/\{\{(\w+)\}\}/g, (_, varName: string) => {
        const replacement = vars[varName]
        return replacement !== undefined ? String(replacement) : `{{${varName}}}`
      })
    }

    return resolved
  }

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
