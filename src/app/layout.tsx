import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/hooks/useTranslation"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { GlucoseSafetyProvider } from "@/contexts/glucose-safety-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GlucoCompanion",
  description: "KI-unterstützte Diabetes Self-Management App",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <LanguageProvider>
          <UserPreferencesProvider>
            <GlucoseSafetyProvider>
              {children}
              <Toaster />
            </GlucoseSafetyProvider>
          </UserPreferencesProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
