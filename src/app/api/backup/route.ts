import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { buildBackupArtifact } from '@/lib/backup-artifact'
import { NextRequest, NextResponse } from 'next/server'

// GET: Export all data as JSON
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const [clients, repairs, purchases, sales, inventory, settings, ledger] = await Promise.all([
      db.client.findMany(),
      db.repair.findMany({ include: { client: true } }),
      db.purchase.findMany({ include: { client: true } }),
      db.sale.findMany({ include: { client: true } }),
      db.inventoryItem.findMany(),
      db.settings.findMany(),
      db.ledgerEntry.findMany(),
    ])

    const backup = buildBackupArtifact({
      clients,
      repairs,
      purchases,
      sales,
      inventory,
      settings,
      ledger,
    })

    return NextResponse.json(backup)
  } catch (error) {
    return NextResponse.json({ error: 'Error al exportar backup' }, { status: 500 })
  }
}

// POST: Import data from JSON backup
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()
    const { data, mode } = body // mode: 'merge' | 'replace'

    if (!data) {
      return NextResponse.json({ error: 'No se proporcionaron datos' }, { status: 400 })
    }

    const results = {
      clients: { created: 0, skipped: 0, errors: 0 },
      repairs: { created: 0, skipped: 0, errors: 0 },
      purchases: { created: 0, skipped: 0, errors: 0 },
      sales: { created: 0, skipped: 0, errors: 0 },
      inventory: { created: 0, skipped: 0, errors: 0 },
      settings: { created: 0, skipped: 0, errors: 0 },
      ledger: { created: 0, skipped: 0, errors: 0 },
    }

    // If replace mode, delete all existing data
    if (mode === 'replace') {
      await db.$transaction([
        db.ledgerEntry.deleteMany(),
        db.repair.deleteMany(),
        db.purchase.deleteMany(),
        db.sale.deleteMany(),
        db.inventoryItem.deleteMany(),
        db.settings.deleteMany(),
        db.client.deleteMany(),
      ])
    }

    // Import clients
    if (data.clients) {
      const existingClients = mode === 'merge' ? await db.client.findMany() : []
      const existingIds = new Set(existingClients.map(c => c.id))
      const existingMobiles = new Set(existingClients.map(c => c.mobile))

      for (const client of data.clients) {
        try {
          if (mode === 'merge' && (existingIds.has(client.id) || existingMobiles.has(client.mobile))) {
            results.clients.skipped++
            continue
          }
          await db.client.create({
            data: {
              id: client.id,
              name: client.name,
              address: client.address || '',
              mobile: client.mobile,
              email: client.email || '',
              createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
              updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date(),
            },
          })
          results.clients.created++
        } catch {
          results.clients.errors++
        }
      }
    }

    // Import repairs
    if (data.repairs) {
      const existing = mode === 'merge' ? await db.repair.findMany() : []
      const existingIds = new Set(existing.map(r => r.id))

      for (const repair of data.repairs) {
        try {
          if (mode === 'merge' && existingIds.has(repair.id)) {
            results.repairs.skipped++
            continue
          }
          await db.repair.create({
            data: {
              id: repair.id,
              clientId: repair.clientId,
              brand: repair.brand,
              model: repair.model,
              storageType: repair.storageType || '',
              storageCapacity: repair.storageCapacity || '',
              ramType: repair.ramType || '',
              ramSize: repair.ramSize || '',
              faultDescription: repair.faultDescription,
              proposedPrice: repair.proposedPrice || 0,
              status: repair.status || 'pending',
              notes: repair.notes || '',
              repairDate: repair.repairDate ? new Date(repair.repairDate) : new Date(),
              warrantyExpires: repair.warrantyExpires ? new Date(repair.warrantyExpires) : null,
              createdAt: repair.createdAt ? new Date(repair.createdAt) : new Date(),
              updatedAt: repair.updatedAt ? new Date(repair.updatedAt) : new Date(),
            },
          })
          results.repairs.created++
        } catch {
          results.repairs.errors++
        }
      }
    }

    // Import purchases
    if (data.purchases) {
      const existing = mode === 'merge' ? await db.purchase.findMany() : []
      const existingIds = new Set(existing.map(p => p.id))

      for (const purchase of data.purchases) {
        try {
          if (mode === 'merge' && existingIds.has(purchase.id)) {
            results.purchases.skipped++
            continue
          }
          await db.purchase.create({
            data: {
              id: purchase.id,
              clientId: purchase.clientId,
              brand: purchase.brand,
              model: purchase.model,
              storageType: purchase.storageType || '',
              storageCapacity: purchase.storageCapacity || '',
              ramType: purchase.ramType || '',
              ramSize: purchase.ramSize || '',
              purchasePrice: purchase.purchasePrice || 0,
              description: purchase.description || '',
              notes: purchase.notes || '',
              purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate) : new Date(),
              createdAt: purchase.createdAt ? new Date(purchase.createdAt) : new Date(),
              updatedAt: purchase.updatedAt ? new Date(purchase.updatedAt) : new Date(),
            },
          })
          results.purchases.created++
        } catch {
          results.purchases.errors++
        }
      }
    }

    // Import sales
    if (data.sales) {
      const existing = mode === 'merge' ? await db.sale.findMany() : []
      const existingIds = new Set(existing.map(s => s.id))

      for (const sale of data.sales) {
        try {
          if (mode === 'merge' && existingIds.has(sale.id)) {
            results.sales.skipped++
            continue
          }
          await db.sale.create({
            data: {
              id: sale.id,
              clientId: sale.clientId,
              brand: sale.brand,
              model: sale.model,
              storageType: sale.storageType || '',
              storageCapacity: sale.storageCapacity || '',
              ramType: sale.ramType || '',
              ramSize: sale.ramSize || '',
              saleType: sale.saleType || 'refurbished_own',
              salePrice: sale.salePrice || 0,
              description: sale.description || '',
              notes: sale.notes || '',
              saleDate: sale.saleDate ? new Date(sale.saleDate) : new Date(),
              warrantyDays: sale.warrantyDays || 15,
              warrantyExpires: sale.warrantyExpires ? new Date(sale.warrantyExpires) : null,
              createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
              updatedAt: sale.updatedAt ? new Date(sale.updatedAt) : new Date(),
            },
          })
          results.sales.created++
        } catch {
          results.sales.errors++
        }
      }
    }

    // Import inventory
    if (data.inventory) {
      const existing = mode === 'merge' ? await db.inventoryItem.findMany() : []
      const existingIds = new Set(existing.map(i => i.id))

      for (const item of data.inventory) {
        try {
          if (mode === 'merge' && existingIds.has(item.id)) {
            results.inventory.skipped++
            continue
          }
          await db.inventoryItem.create({
            data: {
              id: item.id,
              category: item.category,
              name: item.name,
              type: item.type || '',
              capacity: item.capacity || '',
              quantity: item.quantity || 0,
              price: item.price || 0,
              description: item.description || '',
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            },
          })
          results.inventory.created++
        } catch {
          results.inventory.errors++
        }
      }
    }

    // Import settings
    if (data.settings) {
      for (const setting of data.settings) {
        try {
          await db.settings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: { key: setting.key, value: setting.value },
          })
          results.settings.created++
        } catch {
          results.settings.errors++
        }
      }
    }

    // Import ledger entries
    if (data.ledger) {
      const existing = mode === 'merge' ? await db.ledgerEntry.findMany() : []
      const existingIds = new Set(existing.map(l => l.id))

      for (const entry of data.ledger) {
        try {
          if (mode === 'merge' && existingIds.has(entry.id)) {
            results.ledger.skipped++
            continue
          }
          await db.ledgerEntry.create({
            data: {
              id: entry.id,
              type: entry.type,
              sourceType: entry.sourceType,
              sourceId: entry.sourceId,
              amount: entry.amount,
              currency: entry.currency || 'CUP',
              exchangeRate: entry.exchangeRate || 1.0,
              description: entry.description || '',
              reference: entry.reference || '',
              status: entry.status || 'posted',
              createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
              updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
            },
          })
          results.ledger.created++
        } catch {
          results.ledger.errors++
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Error al importar backup' }, { status: 500 })
  }
}
