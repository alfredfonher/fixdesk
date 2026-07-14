import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req)
  if (!auth.ok) return auth.response

  try {
    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 })
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await db.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(newPassword) },
    })

    await db.session.deleteMany({ where: { userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al restablecer contraseña' }, { status: 500 })
  }
}