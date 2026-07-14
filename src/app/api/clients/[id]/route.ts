import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await db.client.findUnique({
      where: { id },
      include: { repairs: true, purchases: true, sales: true },
    })
    if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
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
    const client = await db.client.update({ where: { id }, data: body })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminSession(_req)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    await db.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}
