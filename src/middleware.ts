import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccess = request.cookies.has("gc_access")
  const hasUser = request.cookies.has("gc_user_id")
  const hasConsent = request.cookies.has("gc_consent")
  const hasOnboarding = request.cookies.has("gc_onboarding")

  if (pathname === "/access") {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  /** Legal / study info — fully public, no access or auth cookies required */
  if (pathname === "/datenschutz" || pathname === "/thesis-info" || pathname === "/impressum") {
    return NextResponse.next()
  }

  const redirectAccess = () => NextResponse.redirect(new URL("/access", request.url))
  const redirectLogin = () => NextResponse.redirect(new URL("/login", request.url))
  const redirectConsent = () => NextResponse.redirect(new URL("/consent", request.url))

  if (pathname === "/login" || pathname === "/register") {
    if (!hasAccess) {
      return redirectAccess()
    }
    return NextResponse.next()
  }

  if (pathname === "/privacy" || pathname === "/thesis" || pathname === "/imprint") {
    if (!hasAccess) {
      return redirectAccess()
    }
    return NextResponse.next()
  }

  if (pathname === "/consent") {
    if (!hasAccess) {
      return redirectAccess()
    }
    if (!hasUser) {
      return redirectLogin()
    }
    if (hasConsent) {
      if (hasOnboarding) {
        return NextResponse.redirect(new URL("/", request.url))
      }
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    return NextResponse.next()
  }

  if (pathname === "/onboarding") {
    if (!hasAccess) {
      return redirectAccess()
    }
    if (!hasUser) {
      return redirectLogin()
    }
    if (!hasConsent) {
      return redirectConsent()
    }
    if (hasOnboarding) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!hasAccess) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "access_required" }, { status: 401 })
    }
    return redirectAccess()
  }

  if (!hasUser) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 })
    }
    return redirectLogin()
  }

  if (!hasConsent) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "consent_required" }, { status: 403 })
    }
    return redirectConsent()
  }

  if (!hasOnboarding) {
    if (pathname.startsWith("/api/user/onboarding")) {
      return NextResponse.next()
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "onboarding_required" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
