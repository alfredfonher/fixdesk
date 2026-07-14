import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

function calcWarrantyExpiry(repairDate: Date): Date {
  const d = new Date(repairDate)
  d.setMonth(d.getMonth() + 3)
  return d
}

export async function GET() {
  try {
    const repairs = await db.repair.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    })
    return NextResponse.json(repairs)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener reparaciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession(req)
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const {
      clientId, brand, model, storageType, storageCapacity,
      ramType, ramSize, faultDescription, proposedPrice, status, notes, repairDate,
    } = body

    if (!clientId || !brand || !model || !faultDescription) {
      return NextResponse.json({ error: 'Cliente, marca, modelo y descripción son requeridos' }, { status: 400 })
    }

    const rDate = repairDate ? new Date(repairDate) : new Date()
    const warrantyExpires = calcWarrantyExpiry(rDate)

    const repair = await db.repair.create({
      data: {
        clientId, brand, model,
        storageType: storageType || '',
        storageCapacity: storageCapacity || '',
        ramType: ramType || '',
        ramSize: ramSize || '',
        faultDescription,
        proposedPrice: proposedPrice || 0,
        status: status || 'pending',
        notes: notes || '',
        repairDate: rDate,
        warrantyExpires,
      },
      include: { client: true },
    })
    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear reparación' }, { status: 500 })
  }
}
