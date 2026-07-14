import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalClients,
      totalRepairs,
      pendingRepairs,
      inProgressRepairs,
      completedRepairs,
      deliveredRepairs,
      totalPurchases,
      totalSales,
      inventorySummary,
      lowStockItems,
      recentRepairs,
      recentPurchases,
      recentSales,
    ] = await Promise.all([
      db.client.count(),
      db.repair.count(),
      db.repair.count({ where: { status: 'pending' } }),
      db.repair.count({ where: { status: 'in_progress' } }),
      db.repair.count({ where: { status: 'completed' } }),
      db.repair.count({ where: { status: 'delivered' } }),
      db.purchase.count(),
      db.sale.count(),
      db.inventoryItem.aggregate({ _sum: { quantity: true } }),
      db.inventoryItem.count({ where: { quantity: { lte: 2 } } }),
      db.repair.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { client: true } }),
      db.purchase.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { client: true } }),
      db.sale.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { client: true } }),
    ])

    const repairRevenue = await db.repair.aggregate({
      _sum: { proposedPrice: true },
      where: { status: { in: ['completed', 'delivered'] } },
    })

    const purchaseCosts = await db.purchase.aggregate({ _sum: { purchasePrice: true } })
    const salesRevenue = await db.sale.aggregate({ _sum: { salePrice: true } })

    // Warranty expiring soon (next 7 days)
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const expiringWarrantiesRepairs = await db.repair.findMany({
      where: {
        warrantyExpires: { gte: now, lte: nextWeek },
        status: { in: ['completed', 'delivered'] },
      },
      include: { client: true },
    })

    const expiringWarrantiesSales = await db.sale.findMany({
      where: {
        warrantyExpires: { gte: now, lte: nextWeek },
      },
      include: { client: true },
    })

    // Financial summary
    const totalRepairRevenue = repairRevenue._sum.proposedPrice || 0
    const totalPurchaseCosts = purchaseCosts._sum.purchasePrice || 0
    const totalSalesRevenue = salesRevenue._sum.salePrice || 0
    const totalIncome = totalRepairRevenue + totalSalesRevenue
    const netProfit = totalIncome - totalPurchaseCosts

    return NextResponse.json({
      totalClients,
      totalRepairs,
      pendingRepairs,
      inProgressRepairs,
      completedRepairs,
      deliveredRepairs,
      totalPurchases,
      totalSales,
      totalInventoryItems: inventorySummary._sum.quantity || 0,
      lowStockItems,
      totalRepairRevenue,
      totalPurchaseCosts,
      totalSalesRevenue,
      totalIncome,
      netProfit,
      recentRepairs,
      recentPurchases,
      recentSales,
      expiringWarranties: [...expiringWarrantiesRepairs.map(r => ({
        id: r.id,
        type: 'repair' as const,
        brand: r.brand,
        model: r.model,
        client: r.client.name,
        warrantyExpires: r.warrantyExpires,
      })), ...expiringWarrantiesSales.map(s => ({
        id: s.id,
        type: 'sale' as const,
        brand: s.brand,
        model: s.model,
        client: s.client.name,
        warrantyExpires: s.warrantyExpires,
      }))],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
