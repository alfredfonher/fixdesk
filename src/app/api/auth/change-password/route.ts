import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth-utils'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    const auth = await requireAdminSession(req)

    if (!auth.ok) {
      return auth.response
    }

    const user = await db.user.findUnique({
      where: { id: auth.context.user.id },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 })
    }

    // Update password
    await db.user.update({
      where: { id: auth.context.user.id },
      data: { passwordHash: hashPassword(newPassword) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 })
  }
}
