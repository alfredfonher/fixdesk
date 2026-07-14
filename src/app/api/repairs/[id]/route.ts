import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

function calcWarrantyExpiry(repairDate: Date): Date {
  const d = new Date(repairDate)
  d.setMonth(d.getMonth() + 3)
  return d
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const repair = await db.repair.findUnique({ where: { id }, include: { client: true } })
    if (!repair) return NextResponse.json({ error: 'Reparación no encontrada' }, { status: 404 })
    return NextResponse.json(repair)
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
    // Recalculate warranty if repairDate changes
    if (body.repairDate) {
      const rDate = new Date(body.repairDate)
      body.repairDate = rDate
      body.warrantyExpires = calcWarrantyExpiry(rDate)
    }
    const repair = await db.repair.update({ where: { id }, data: body, include: { client: true } })
    return NextResponse.json(repair)
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
    await db.repair.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
