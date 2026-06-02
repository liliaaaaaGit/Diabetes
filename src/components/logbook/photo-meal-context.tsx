"use client"

import { createContext, useContext, type ReactNode } from "react"
import { usePhotoMealAnalysis } from "@/components/logbook/use-photo-meal-analysis"

type PhotoMealContextValue = ReturnType<typeof usePhotoMealAnalysis>

const PhotoMealContext = createContext<PhotoMealContextValue | null>(null)

export function PhotoMealProvider({
  children,
  onEntrySaved,
}: {
  children: ReactNode
  onEntrySaved?: (dates?: string[]) => void | Promise<void>
}) {
  const value = usePhotoMealAnalysis(onEntrySaved)
  return <PhotoMealContext.Provider value={value}>{children}</PhotoMealContext.Provider>
}

export function usePhotoMealContext(): PhotoMealContextValue {
  const ctx = useContext(PhotoMealContext)
  if (!ctx) throw new Error("usePhotoMealContext must be used within PhotoMealProvider")
  return ctx
}
