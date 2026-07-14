import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { createSaleEntry } from '@/lib/ledger'
import { NextRequest, NextResponse } from 'next/server'

function calcSaleWarranty(saleDate: Date, warrantyDays: number): Date {
  const d = new Date(saleDate)
  d.setDate(d.getDate() + warrantyDays)
  return d
}

export async function GET() {
  try {
    const sales = await db.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true, inventoryItem: true },
    })
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
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
      ramType, ramSize, saleType, salePrice, description, notes, saleDate,
      inventoryItemId,
    } = body

    if (!clientId || !brand || !model) {
      return NextResponse.json({ error: 'Cliente, marca y modelo son requeridos' }, { status: 400 })
    }

    const sType = saleType || 'refurbished_own'
    const warrantyDays = sType === 'refurbished_imported' ? 30 : 15
    const sDate = saleDate ? new Date(saleDate) : new Date()
    const warrantyExpires = calcSaleWarranty(sDate, warrantyDays)

    const sale = await db.$transaction(async (tx) => {
      let linkedInventoryItemId: string | null = null

      if (inventoryItemId) {
        const item = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } })
        if (!item) {
          throw new Error('INVENTORY_NOT_FOUND')
        }
        if (item.status !== 'available') {
          throw new Error('INVENTORY_NOT_AVAILABLE')
        }
        if (item.category !== 'laptop') {
          throw new Error('INVENTORY_NOT_LAPTOP')
        }
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { status: 'sold' },
        })
        linkedInventoryItemId = inventoryItemId
      }

      const createdSale = await tx.sale.create({
        data: {
          clientId, brand, model,
          storageType: storageType || '',
          storageCapacity: storageCapacity || '',
          ramType: ramType || '',
          ramSize: ramSize || '',
          saleType: sType,
          salePrice: salePrice || 0,
          description: description || '',
          notes: notes || '',
          saleDate: sDate,
          warrantyDays,
          warrantyExpires,
          inventoryItemId: linkedInventoryItemId,
        },
        include: { client: true, inventoryItem: true },
      })

      await createSaleEntry(
        tx,
        createdSale.id,
        salePrice || 0,
        `${brand} ${model}`.trim(),
        sDate,
      )

      return createdSale
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVENTORY_NOT_FOUND') {
        return NextResponse.json({ error: 'Ítem de inventario no encontrado' }, { status: 404 })
      }
      if (error.message === 'INVENTORY_NOT_AVAILABLE') {
        return NextResponse.json({ error: 'La laptop seleccionada ya no está disponible' }, { status: 409 })
      }
      if (error.message === 'INVENTORY_NOT_LAPTOP') {
        return NextResponse.json({ error: 'El ítem seleccionado no es una laptop' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Error al crear venta' }, { status: 500 })
  }
}
