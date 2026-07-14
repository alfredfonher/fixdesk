import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { repairs: true, purchases: true, sales: true } },
      },
    })
    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession(req)
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { name, address, mobile, email } = body
    if (!name || !mobile) {
      return NextResponse.json({ error: 'Nombre y móvil son requeridos' }, { status: 400 })
    }
    const client = await db.client.create({
      data: { name, address: address || '', mobile, email: email || '' },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
