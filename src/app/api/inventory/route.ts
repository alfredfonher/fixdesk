import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (category) where.category = category
    if (status) where.status = status

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession(req)
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { category, name, type, capacity, quantity, price, description } = body
    if (!category || !name) {
      return NextResponse.json({ error: 'Categoría y nombre son requeridos' }, { status: 400 })
    }
    const item = await db.inventoryItem.create({
      data: {
        category, name,
        type: type || '',
        capacity: capacity || '',
        quantity: quantity || 0,
        price: price || 0,
        description: description || '',
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 })
  }
}
