import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccess = request.cookies.has("gc_access")
  const hasUser = request.cookies.has("gc_user_id")
  const hasConsent = request.cookies.has("gc_consent")

  if (pathname === "/access") {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/auth/")) {
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

  if (pathname === "/privacy") {
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
