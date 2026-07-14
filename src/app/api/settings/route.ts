import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    if (key) {
      const setting = await db.settings.findUnique({ where: { key } })
      return NextResponse.json({ key, value: setting?.value || null })
    }
    const settings = await db.settings.findMany()
    const result: Record<string, string> = {}
    settings.forEach(s => { result[s.key] = s.value })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()
    const { key, value } = body
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key y value son requeridos' }, { status: 400 })
    }
    const setting = await db.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
    return NextResponse.json(setting)
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Key requerido' }, { status: 400 })
    await db.settings.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar configuración' }, { status: 500 })
  }
}
