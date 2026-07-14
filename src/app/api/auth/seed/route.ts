import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'

// POST: Seed default admin user only in non-production and only when no users exist
export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Seed route disabled in production' }, { status: 403 })
    }

    const userCount = await db.user.count()

    if (userCount > 0) {
      return NextResponse.json({ message: 'Ya existen usuarios. No se creó ninguno.', existingUsers: userCount }, { status: 409 })
    }

    const defaultUser = await db.user.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        displayName: 'Administrador',
        role: 'admin',
      },
    })

    return NextResponse.json({
      message: 'Usuario por defecto creado',
      user: {
        id: defaultUser.id,
        username: defaultUser.username,
        displayName: defaultUser.displayName,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error al crear usuario por defecto' }, { status: 500 })
  }
}
