import { db } from '@/lib/db'
import { isTokenExpired } from '@/lib/auth-utils'
import { getClearedSessionCookieOptions, getSessionTokenFromRequest, SESSION_COOKIE_NAME } from '@/lib/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = getSessionTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 })
    }

    const clearCookie = (response: NextResponse) => {
      response.cookies.set(SESSION_COOKIE_NAME, '', getClearedSessionCookieOptions(req))
      return response
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) {
      return clearCookie(NextResponse.json({ valid: false, error: 'Sesión no encontrada' }, { status: 401 }))
    }

    if (isTokenExpired(session.expiresAt)) {
      await db.session.delete({ where: { id: session.id } })
      return clearCookie(NextResponse.json({ valid: false, error: 'Sesión expirada' }, { status: 401 }))
    }

    if (!session.user.isActive) {
      await db.session.delete({ where: { id: session.id } })
      return clearCookie(NextResponse.json({ valid: false, error: 'Usuario inactivo' }, { status: 401 }))
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        displayName: session.user.displayName,
        role: session.user.role,
      },
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ valid: false, error: 'Error al verificar sesión' }, { status: 500 })
  }
}
