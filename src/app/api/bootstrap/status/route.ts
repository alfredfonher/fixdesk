import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [userCount, setting] = await Promise.all([
      db.user.count(),
      db.settings.findUnique({ where: { key: 'firstRunCompleted' } }),
    ])

    const completed = setting?.value === 'true'

    return NextResponse.json({
      needsBootstrap: userCount === 0 || !completed,
      hasUsers: userCount > 0,
      completed,
    })
  } catch {
    return NextResponse.json({ error: 'Error al verificar el estado inicial' }, { status: 500 })
  }
}
