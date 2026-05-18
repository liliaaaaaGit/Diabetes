import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/hooks/useTranslation"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { GlucoseSafetyProvider } from "@/contexts/glucose-safety-context"
import { PwaRegister } from "@/components/pwa-register"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GlucoCompanion",
  description: "KI-unterstützte Diabetes Self-Management App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GlucoCompanion",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
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
              <PwaRegister />
              <Toaster />
            </GlucoseSafetyProvider>
          </UserPreferencesProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
