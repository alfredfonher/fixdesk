import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-session'

// GET: List all active users (admin-only)
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST: Create a new user (admin-only)
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { username, password, displayName, role } = await req.json()
    const normalizedUsername = String(username || '').trim()

    if (!normalizedUsername || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    // Check if username already exists
    const existing = await db.user.findUnique({ where: { username: normalizedUsername } })
    if (existing) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 })
    }

    const validRoles = ['admin', 'technician', 'viewer']
    const userRole = validRoles.includes(role) ? role : 'admin'

    const user = await db.user.create({
      data: {
        username: normalizedUsername,
        passwordHash: hashPassword(password),
        displayName: displayName || '',
        role: userRole,
      },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}

// PUT: Update a user's username/role/displayName (admin-only)
export async function PUT(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id, role, displayName, username } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    const validRoles = ['admin', 'technician', 'viewer']

    const updateData: { role?: string; displayName?: string; username?: string } = {}

    if (username !== undefined) {
      const normalizedUsername = String(username).trim()

      if (!normalizedUsername) {
        return NextResponse.json({ error: 'El nombre de usuario no puede estar vacío' }, { status: 400 })
      }

      const existing = await db.user.findUnique({ where: { username: normalizedUsername } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 })
      }

      updateData.username = normalizedUsername
    }

    if (role !== undefined) {
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      updateData.role = role
    }
    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

// DELETE: Deactivate a user (admin-only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })

    if (id === auth.context.user.id) {
      return NextResponse.json({ error: 'No puedes desactivar tu propio usuario' }, { status: 400 })
    }

    await db.session.deleteMany({ where: { userId: id } })
    await db.user.update({ where: { id }, data: { isActive: false } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al desactivar usuario' }, { status: 500 })
  }
}
