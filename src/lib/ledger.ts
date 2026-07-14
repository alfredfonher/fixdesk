import { PrismaClient } from '@prisma/client'

type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

export async function createPurchaseEntry(
  tx: PrismaTx,
  purchaseId: string,
  amount: number,
  description: string,
  purchaseDate: Date,
) {
  if (amount <= 0) return null

  return tx.ledgerEntry.create({
    data: {
      type: 'expense',
      sourceType: 'purchase',
      sourceId: purchaseId,
      amount,
      currency: 'CUP',
      exchangeRate: 1,
      description,
      reference: `Compra ${purchaseDate.toISOString().slice(0, 10)}`,
      status: 'posted',
    },
  })
}

export async function syncPurchaseEntry(
  tx: PrismaTx,
  purchaseId: string,
  amount: number,
  description: string,
  purchaseDate: Date,
) {
  const existing = await tx.ledgerEntry.findFirst({
    where: { sourceType: 'purchase', sourceId: purchaseId, status: 'posted' },
  })

  if (!existing) {
    return createPurchaseEntry(tx, purchaseId, amount, description, purchaseDate)
  }

  if (amount <= 0) {
    return tx.ledgerEntry.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    })
  }

  return tx.ledgerEntry.update({
    where: { id: existing.id },
    data: {
      amount,
      description,
      reference: `Compra ${purchaseDate.toISOString().slice(0, 10)}`,
    },
  })
}

export async function cancelPurchaseEntry(tx: PrismaTx, purchaseId: string) {
  const existing = await tx.ledgerEntry.findFirst({
    where: { sourceType: 'purchase', sourceId: purchaseId, status: 'posted' },
  })

  if (!existing) return null

  return tx.ledgerEntry.update({
    where: { id: existing.id },
    data: { status: 'cancelled' },
  })
}

export async function createSaleEntry(
  tx: PrismaTx,
  saleId: string,
  amount: number,
  description: string,
  saleDate: Date,
) {
  if (amount <= 0) return null

  return tx.ledgerEntry.create({
    data: {
      type: 'income',
      sourceType: 'sale',
      sourceId: saleId,
      amount,
      currency: 'CUP',
      exchangeRate: 1,
      description,
      reference: `Venta ${saleDate.toISOString().slice(0, 10)}`,
      status: 'posted',
    },
  })
}

export async function syncSaleEntry(
  tx: PrismaTx,
  saleId: string,
  amount: number,
  description: string,
  saleDate: Date,
) {
  const existing = await tx.ledgerEntry.findFirst({
    where: { sourceType: 'sale', sourceId: saleId, status: 'posted' },
  })

  if (!existing) {
    return createSaleEntry(tx, saleId, amount, description, saleDate)
  }

  if (amount <= 0) {
    return tx.ledgerEntry.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    })
  }

  return tx.ledgerEntry.update({
    where: { id: existing.id },
    data: {
      amount,
      description,
      reference: `Venta ${saleDate.toISOString().slice(0, 10)}`,
    },
  })
}

export async function cancelSaleEntry(tx: PrismaTx, saleId: string) {
  const existing = await tx.ledgerEntry.findFirst({
    where: { sourceType: 'sale', sourceId: saleId, status: 'posted' },
  })

  if (!existing) return null

  return tx.ledgerEntry.update({
    where: { id: existing.id },
    data: { status: 'cancelled' },
  })
}
