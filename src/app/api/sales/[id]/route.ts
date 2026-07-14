import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { syncSaleEntry, cancelSaleEntry } from '@/lib/ledger'
import { NextRequest, NextResponse } from 'next/server'

function calcSaleWarranty(saleDate: Date, warrantyDays: number): Date {
  const d = new Date(saleDate)
  d.setDate(d.getDate() + warrantyDays)
  return d
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sale = await db.sale.findUnique({ where: { id }, include: { client: true, inventoryItem: true } })
    if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    return NextResponse.json(sale)
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

    const sale = await db.sale.findUnique({ where: { id } })
    if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

    // Recalculate warranty if saleDate or saleType changes
    if (body.saleDate || body.saleType) {
      const sType = body.saleType || sale.saleType
      const warrantyDays = sType === 'refurbished_imported' ? 30 : 15
      const sDate = body.saleDate ? new Date(body.saleDate) : sale.saleDate
      if (body.saleDate) body.saleDate = sDate
      body.warrantyDays = warrantyDays
      body.warrantyExpires = calcSaleWarranty(sDate, warrantyDays)
    }

    const updated = await db.$transaction(async (tx) => {
      const newInventoryItemId = body.inventoryItemId !== undefined ? body.inventoryItemId : undefined

      if (newInventoryItemId !== undefined && newInventoryItemId !== sale.inventoryItemId) {
        // Restore old inventory item if one was linked
        if (sale.inventoryItemId) {
          const oldItem = await tx.inventoryItem.findUnique({ where: { id: sale.inventoryItemId } })
          if (oldItem && oldItem.status === 'sold') {
            await tx.inventoryItem.update({
              where: { id: sale.inventoryItemId },
              data: { status: 'available' },
            })
          }
        }

        // Mark new inventory item as sold
        if (newInventoryItemId) {
          const newItem = await tx.inventoryItem.findUnique({ where: { id: newInventoryItemId } })
          if (!newItem) throw new Error('INVENTORY_NOT_FOUND')
          if (newItem.status !== 'available') throw new Error('INVENTORY_NOT_AVAILABLE')
          if (newItem.category !== 'laptop') throw new Error('INVENTORY_NOT_LAPTOP')
          await tx.inventoryItem.update({
            where: { id: newInventoryItemId },
            data: { status: 'sold' },
          })
        }

        body.inventoryItemId = newInventoryItemId
      } else {
        // Remove inventoryItemId from body if not changing to avoid overwriting
        delete body.inventoryItemId
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: body,
        include: { client: true, inventoryItem: true },
      })

      await syncSaleEntry(
        tx,
        updatedSale.id,
        updatedSale.salePrice || 0,
        `${updatedSale.brand} ${updatedSale.model}`.trim(),
        updatedSale.saleDate,
      )

      return updatedSale
    })

    return NextResponse.json(updated)
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

    const sale = await db.sale.findUnique({ where: { id } })
    if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

    await db.$transaction(async (tx) => {
      // Restore linked inventory item to available
      if (sale.inventoryItemId) {
        const item = await tx.inventoryItem.findUnique({ where: { id: sale.inventoryItemId } })
        if (item && item.status === 'sold') {
          await tx.inventoryItem.update({
            where: { id: sale.inventoryItemId },
            data: { status: 'available' },
          })
        }
      }
      await tx.sale.delete({ where: { id } })
      await cancelSaleEntry(tx, id)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
