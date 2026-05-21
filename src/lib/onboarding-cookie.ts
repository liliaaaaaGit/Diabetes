export const ONBOARDING_COOKIE = "gc_onboarding"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

type CookieStore = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean
      secure: boolean
      sameSite: "strict"
      maxAge: number
      path: string
    }
  ) => void
  delete: (name: string) => void
}

export function setOnboardingCookie(cookieStore: CookieStore): void {
  cookieStore.set(ONBOARDING_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
}

export function clearOnboardingCookie(cookieStore: CookieStore): void {
  cookieStore.delete(ONBOARDING_COOKIE)
}
