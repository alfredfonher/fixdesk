import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { createPurchaseEntry } from '@/lib/ledger'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const purchases = await db.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    })
    return NextResponse.json(purchases)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
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
      ramType, ramSize, ramSticks, gpuModel, vramSize, vramType,
      purchasePrice, description, notes, purchaseDate,
    } = body

    if (!clientId || !brand || !model) {
      return NextResponse.json({ error: 'Cliente, marca y modelo son requeridos' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          clientId, brand, model,
          storageType: storageType || '',
          storageCapacity: storageCapacity || '',
          ramType: ramType || '',
          ramSize: ramSize || '',
          purchasePrice: purchasePrice || 0,
          description: description || '',
          notes: notes || '',
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        },
        include: { client: true },
      })

      const laptopName = `${brand} ${model}`.trim()
      const laptopSpecs = [storageCapacity, storageType, ramSize, ramType].filter(Boolean).join(' / ')

      await tx.inventoryItem.create({
        data: {
          category: 'laptop',
          name: laptopName,
          type: '',
          capacity: storageCapacity || '',
          quantity: 1,
          price: purchasePrice || 0,
          description: laptopSpecs || description || '',
          purchaseId: purchase.id,
          source: 'purchase',
          status: 'available',
          brand: brand || '',
          ramType: ramType || '',
          ramSize: ramSize || '',
          ramSticks: ramSticks || '',
          gpuModel: gpuModel || '',
          vramSize: vramSize || '',
          vramType: vramType || '',
          storageType: storageType || '',
          storageCapacity: storageCapacity || '',
        },
      })

      await createPurchaseEntry(
        tx,
        purchase.id,
        purchasePrice || 0,
        `${brand} ${model}`.trim(),
        purchase.purchaseDate,
      )

      return purchase
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear compra' }, { status: 500 })
  }
}
