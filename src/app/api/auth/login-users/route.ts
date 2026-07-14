import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET: Minimal active-user list for the unauthenticated login UI.
// Public by design — exposes only id/username/displayName. The role field is
// intentionally NOT returned to avoid leaking which accounts hold admin /
// technician / viewer privileges to anonymous callers (target selection for
// credential-stuffing). The full admin endpoint GET /api/auth/users remains
// gated by requireAdminSession.
export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Get login users error:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}
