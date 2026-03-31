import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow access page
  if (pathname === "/access") {
    return NextResponse.next()
  }

  // Always allow auth API routes
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  // Check access cookie
  const hasAccess = request.cookies.has("gc_access")

  // Consent, register, and login pages require access cookie
  if (
    pathname === "/consent" ||
    pathname === "/privacy" ||
    pathname === "/register" ||
    pathname === "/login"
  ) {
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/access", request.url))
    }
    return NextResponse.next()
  }

  // All other routes require both access and user cookies
  const hasUser = request.cookies.has("gc_user_id")

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/access", request.url))
  }

  if (!hasUser) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
