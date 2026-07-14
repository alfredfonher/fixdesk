import { db } from '@/lib/db'
import { getClearedSessionCookieOptions, getSessionTokenFromRequest, SESSION_COOKIE_NAME } from '@/lib/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = getSessionTokenFromRequest(req)

    if (token) {
      await db.session.deleteMany({ where: { token } }).catch(() => {})
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', getClearedSessionCookieOptions(req))

    return response
  } catch {
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', getClearedSessionCookieOptions(req))
    return response
  }
}
