import { db } from '@/lib/db'
import { isTokenExpired } from '@/lib/auth-utils'
import { getClearedSessionCookieOptions, getSessionTokenFromRequest, SESSION_COOKIE_NAME } from '@/lib/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export type AdminContext = {
  user: {
    id: string
    username: string
    displayName: string
    role: string
  }
  session: {
    id: string
    token: string
    expiresAt: Date
  }
}

type AuthResult =
  | { ok: true; context: AdminContext }
  | { ok: false; response: NextResponse }

function clearSessionCookie(req: NextRequest, response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', getClearedSessionCookieOptions(req))
  return response
}

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 })
}

export async function requireAdminSession(req: NextRequest): Promise<AuthResult> {
  const token = getSessionTokenFromRequest(req)

  if (!token) {
    return { ok: false, response: unauthorized('Autenticación requerida') }
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) {
    return {
      ok: false,
      response: clearSessionCookie(req, unauthorized('Sesión no encontrada')),
    }
  }

  if (isTokenExpired(session.expiresAt)) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})

    return {
      ok: false,
      response: clearSessionCookie(req, unauthorized('Sesión expirada')),
    }
  }

  if (!session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})

    return {
      ok: false,
      response: clearSessionCookie(req, unauthorized('Usuario inactivo')),
    }
  }

  return {
    ok: true,
    context: {
      user: {
        id: session.user.id,
        username: session.user.username,
        displayName: session.user.displayName,
        role: session.user.role,
      },
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
      },
    },
  }
}
