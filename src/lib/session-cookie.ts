import { NextRequest } from 'next/server'

export const SESSION_COOKIE_NAME = 'techfix_session_token'

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60
const isProduction = process.env.NODE_ENV === 'production'

function isLoopbackHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
}

function shouldUseSecureCookies(req?: NextRequest): boolean {
  if (!isProduction) return false
  if (!req) return true

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
  const proto = req.headers.get('x-forwarded-proto') ?? ''

  if (isLoopbackHost(host)) return false
  if (proto && proto !== 'https') return false

  return true
}

export function getSessionCookieOptions(req?: NextRequest) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: shouldUseSecureCookies(req),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

export function getClearedSessionCookieOptions(req?: NextRequest) {
  return {
    ...getSessionCookieOptions(req),
    maxAge: 0,
  }
}

export function getSessionTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null
}
