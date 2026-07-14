import { db } from '@/lib/db'
import { verifyPassword, generateToken, hashPassword, shouldUpgradePasswordHash } from '@/lib/auth-utils'
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/session-cookie'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const normalizedUsername = String(username || '').trim()

    if (!normalizedUsername || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username: normalizedUsername } })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 401 })
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    if (shouldUpgradePasswordHash(user.passwordHash)) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: hashPassword(password) },
        })
      } catch (upgradeError) {
        console.error('Password hash upgrade error:', upgradeError)
      }
    }

    // Create session token (expires in 24 hours for server-side, client manages 15-min timeout)
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Clean up old sessions for this user
    await db.session.deleteMany({ where: { userId: user.id } })

    // Create new session
    await db.session.create({
      data: { userId: user.id, token, expiresAt },
    })

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    })

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(req))

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
