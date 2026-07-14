import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const sourceType = searchParams.get('sourceType')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (sourceType) where.sourceType = sourceType
    if (status) where.status = status

    const entries = await db.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener registros contables' }, { status: 500 })
  }
}
