import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await db.inventoryItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession(req)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const body = await req.json()
    const item = await db.inventoryItem.update({ where: { id }, data: body })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession(_req)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    await db.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
