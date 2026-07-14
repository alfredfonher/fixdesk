import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { syncPurchaseEntry, cancelPurchaseEntry } from '@/lib/ledger'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const purchase = await db.purchase.findUnique({ where: { id }, include: { client: true } })
    if (!purchase) return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    return NextResponse.json(purchase)
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
    if (body.purchaseDate) {
      body.purchaseDate = new Date(body.purchaseDate)
    }

    const result = await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.update({ where: { id }, data: body, include: { client: true } })

      const linkedItem = await tx.inventoryItem.findUnique({ where: { purchaseId: id } })
      if (linkedItem) {
        const laptopName = `${purchase.brand} ${purchase.model}`.trim()
        const laptopSpecs = [purchase.storageCapacity, purchase.storageType, purchase.ramSize, purchase.ramType].filter(Boolean).join(' / ')

        await tx.inventoryItem.update({
          where: { purchaseId: id },
          data: {
            name: laptopName,
            capacity: purchase.storageCapacity || '',
            price: purchase.purchasePrice || 0,
            description: laptopSpecs || purchase.description || '',
            brand: purchase.brand || '',
            ramType: purchase.ramType || '',
            ramSize: purchase.ramSize || '',
            ramSticks: purchase.ramSticks || '',
            gpuModel: purchase.gpuModel || '',
            vramSize: purchase.vramSize || '',
            vramType: purchase.vramType || '',
            storageType: purchase.storageType || '',
            storageCapacity: purchase.storageCapacity || '',
          },
        })
      }

      await syncPurchaseEntry(
        tx,
        purchase.id,
        purchase.purchasePrice || 0,
        `${purchase.brand} ${purchase.model}`.trim(),
        purchase.purchaseDate,
      )

      return purchase
    })

    return NextResponse.json(result)
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

    const linkedItem = await db.inventoryItem.findUnique({ where: { purchaseId: id } })
    if (linkedItem && linkedItem.status !== 'available') {
      return NextResponse.json(
        { error: 'No se puede eliminar: la laptop asociada ya no está disponible (vendida o reservada)' },
        { status: 409 },
      )
    }

    await db.$transaction(async (tx) => {
      if (linkedItem) {
        await tx.inventoryItem.delete({ where: { purchaseId: id } })
      }
      await tx.purchase.delete({ where: { id } })
      await cancelPurchaseEntry(tx, id)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
