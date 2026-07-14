import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const normalizedUsername = String(body.username || '').trim()
    const normalizedDisplayName = String(body.displayName || '').trim()
    const password = String(body.password || '')

    if (!normalizedUsername || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    const [userCount, setting] = await Promise.all([
      db.user.count(),
      db.settings.findUnique({ where: { key: 'firstRunCompleted' } }),
    ])

    if (userCount > 0 || setting?.value === 'true') {
      return NextResponse.json({ error: 'La configuración inicial ya fue completada' }, { status: 409 })
    }

    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          username: normalizedUsername,
          passwordHash: hashPassword(password),
          displayName: normalizedDisplayName || normalizedUsername,
          role: 'admin',
        },
      })

      const settings = [
        ['firstRunCompleted', 'true'],
        ['businessFocus', String(body.businessFocus || 'laptops')],
        ['currency', String(body.currency || 'CUP')],
        ['exchangeRate', String(body.exchangeRate || '25')],
        ['appearancePalette', String(body.appearancePalette || 'sapphire')],
        ['appearanceStyle', String(body.appearanceStyle || 'macos-classic')],
        ['appearanceDensity', String(body.appearanceDensity || 'comfortable')],
        ['themeMode', String(body.themeMode || 'system')],
      ]

      for (const [key, value] of settings) {
        await tx.settings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bootstrap completion failed', error)

    const details = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error al completar la configuración inicial', details },
      { status: 500 },
    )
  }
}
