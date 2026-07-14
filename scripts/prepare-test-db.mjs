import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const prismaDir = path.join(rootDir, 'prisma')
const testDbDir = path.join(rootDir, 'db', 'test')
const testDbPath = path.join(testDbDir, 'custom.test.db')
const testDbUrl = toSqliteUrl(testDbPath, prismaDir)
const testDbClientUrl = toSqliteUrl(testDbPath)
const prismaBin = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
)

fs.mkdirSync(testDbDir, { recursive: true })
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  fs.rmSync(`${testDbPath}${suffix}`, { force: true })
}

const result = spawnSync(
  prismaBin,
  ['db', 'push', '--schema', path.join('prisma', 'schema.prisma'), '--skip-generate'],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: testDbUrl,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

if (result.status !== 0) {
  throw new Error('Failed to push schema to test database')
}

const db = new PrismaClient({
  datasources: {
    db: { url: testDbClientUrl },
  },
})

try {
  await seedTestData(db)
  console.log(`Prepared seeded test database at ${path.relative(rootDir, testDbPath)}`)
} finally {
  await db.$disconnect()
}

async function seedTestData(db) {
  const fixedDate = new Date('2026-01-15T10:00:00.000Z')
  const repairDate = new Date('2026-01-10T09:00:00.000Z')
  const saleDate = new Date('2026-01-12T11:00:00.000Z')
  const purchaseDate = new Date('2026-01-05T14:00:00.000Z')

  await db.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        id: 'test-client-primary',
        name: 'Test Client Primary',
        address: '123 Verification Avenue',
        mobile: '+5355500001',
        email: 'primary.client@example.test',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
    })

    const businessClient = await tx.client.create({
      data: {
        id: 'test-client-business',
        name: 'Test Business Client',
        address: '456 Smoke Test Street',
        mobile: '+5355500002',
        email: 'business.client@example.test',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
    })

    await tx.user.createMany({
      data: [
        {
          id: 'test-user-admin',
          username: 'admin.test',
          passwordHash: legacyPasswordHash('AdminTest123!'),
          displayName: 'Test Admin',
          role: 'admin',
          isActive: true,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-user-technician',
          username: 'technician.test',
          passwordHash: legacyPasswordHash('TechnicianTest123!'),
          displayName: 'Test Technician',
          role: 'technician',
          isActive: true,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-user-viewer',
          username: 'viewer.test',
          passwordHash: legacyPasswordHash('ViewerTest123!'),
          displayName: 'Test Viewer',
          role: 'viewer',
          isActive: true,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ],
    })

    await tx.repair.create({
      data: {
        id: 'test-repair-diagnostic',
        clientId: client.id,
        brand: 'Lenovo',
        model: 'ThinkPad T480',
        storageType: 'SSD',
        storageCapacity: '512GB',
        ramType: 'DDR4',
        ramSize: '16GB',
        ramSticks: '2x 8GB',
        gpuModel: 'Intel UHD 620',
        faultDescription: 'Intermittent charging failure',
        proposedPrice: 2500,
        status: 'in_progress',
        notes: 'Seeded repair for verification coverage',
        repairDate,
        warrantyExpires: new Date('2026-04-10T09:00:00.000Z'),
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
    })

    const purchase = await tx.purchase.create({
      data: {
        id: 'test-purchase-laptop',
        clientId: businessClient.id,
        brand: 'Dell',
        model: 'Latitude 7490',
        storageType: 'SSD',
        storageCapacity: '256GB',
        ramType: 'DDR4',
        ramSize: '8GB',
        ramSticks: '1x 8GB',
        purchasePrice: 18000,
        description: 'Refurbishment candidate',
        notes: 'Seeded purchase for verification coverage',
        purchaseDate,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
    })

    await tx.inventoryItem.createMany({
      data: [
        {
          id: 'test-inventory-purchased-laptop',
          category: 'laptop',
          name: 'Dell Latitude 7490',
          capacity: '256GB',
          quantity: 1,
          price: 18000,
          description: 'Purchased laptop ready for refurbishment',
          purchaseId: purchase.id,
          source: 'purchase',
          status: 'available',
          brand: 'Dell',
          ramType: 'DDR4',
          ramSize: '8GB',
          ramSticks: '1x 8GB',
          storageType: 'SSD',
          storageCapacity: '256GB',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-inventory-ram',
          category: 'ram',
          name: 'DDR4 SODIMM 8GB',
          type: 'DDR4',
          capacity: '8GB',
          quantity: 5,
          price: 3500,
          description: 'Seeded memory stock',
          source: 'manual',
          status: 'available',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-inventory-storage',
          category: 'storage',
          name: 'SATA SSD 512GB',
          type: 'SSD',
          capacity: '512GB',
          quantity: 3,
          price: 6200,
          description: 'Seeded storage stock',
          source: 'manual',
          status: 'available',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ],
    })

    const sale = await tx.sale.create({
      data: {
        id: 'test-sale-refurbished',
        clientId: client.id,
        brand: 'HP',
        model: 'EliteBook 840 G5',
        storageType: 'SSD',
        storageCapacity: '512GB',
        ramType: 'DDR4',
        ramSize: '16GB',
        saleType: 'refurbished_imported',
        salePrice: 42000,
        description: 'Seeded refurbished sale',
        notes: 'Seeded sale for verification coverage',
        saleDate,
        warrantyDays: 30,
        warrantyExpires: new Date('2026-02-11T11:00:00.000Z'),
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
    })

    await tx.ledgerEntry.createMany({
      data: [
        {
          id: 'test-ledger-purchase',
          type: 'expense',
          sourceType: 'purchase',
          sourceId: purchase.id,
          amount: 18000,
          currency: 'CUP',
          exchangeRate: 1,
          description: 'Dell Latitude 7490',
          reference: 'Purchase 2026-01-05',
          status: 'posted',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-ledger-sale',
          type: 'income',
          sourceType: 'sale',
          sourceId: sale.id,
          amount: 42000,
          currency: 'CUP',
          exchangeRate: 1,
          description: 'HP EliteBook 840 G5',
          reference: 'Sale 2026-01-12',
          status: 'posted',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ],
    })

    await tx.settings.createMany({
      data: [
        {
          id: 'test-setting-business-name',
          key: 'business.name',
          value: 'TechFix Pro Verification Lab',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-setting-setup-complete',
          key: 'setupComplete',
          value: 'true',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
        {
          id: 'test-setting-first-run-completed',
          key: 'firstRunCompleted',
          value: 'true',
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      ],
    })
  })
}

function legacyPasswordHash(password) {
  return createHash('sha256').update(`${password}techfix-pro-salt-2024`).digest('hex')
}

function toSqliteUrl(filePath, baseDir) {
  if (!baseDir) {
    return `file:${filePath.split(path.sep).join('/')}`
  }

  const relativePath = path.relative(baseDir, filePath)
  const normalizedRelativePath = relativePath.split(path.sep).join('/')

  if (relativePath && !path.isAbsolute(relativePath)) {
    return normalizedRelativePath.startsWith('.')
      ? `file:${normalizedRelativePath}`
      : `file:./${normalizedRelativePath}`
  }

  return `file:${filePath.split(path.sep).join('/')}`
}
