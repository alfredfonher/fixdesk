import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const testDbPath = path.join(rootDir, 'db', 'test', 'custom.test.db')
const testDbUrl = toSqliteUrl(testDbPath)

const db = new PrismaClient({
  datasources: {
    db: { url: testDbUrl },
  },
})

try {
  await verifyTestData(db)
  console.log('Test database verification passed')
} finally {
  await db.$disconnect()
}

async function verifyTestData(db) {
  const expectations = [
    ['Client', () => db.client.count(), 2],
    ['Repair', () => db.repair.count(), 1],
    ['Purchase', () => db.purchase.count(), 1],
    ['Sale', () => db.sale.count(), 1],
    ['InventoryItem', () => db.inventoryItem.count(), 3],
    ['LedgerEntry', () => db.ledgerEntry.count(), 2],
    ['Settings', () => db.settings.count(), 3],
  ]

  for (const [label, count, expected] of expectations) {
    const actual = await count()
    assert(actual >= expected, `${label} expected at least ${expected}, found ${actual}`)
  }

  const roles = await db.user.groupBy({
    by: ['role'],
    _count: { role: true },
  })
  const roleCounts = Object.fromEntries(roles.map((role) => [role.role, role._count.role]))

  for (const role of ['admin', 'technician', 'viewer']) {
    assert(roleCounts[role] >= 1, `User role ${role} expected at least 1, found ${roleCounts[role] || 0}`)
  }

  const setupComplete = await db.settings.findUnique({ where: { key: 'setupComplete' } })
  assert(setupComplete?.value === 'true', 'Setting setupComplete expected to be true')

  const firstRunCompleted = await db.settings.findUnique({ where: { key: 'firstRunCompleted' } })
  assert(firstRunCompleted?.value === 'true', 'Setting firstRunCompleted expected to be true')

  const postedLedgerEntries = await db.ledgerEntry.count({ where: { status: 'posted' } })
  assert(postedLedgerEntries >= 2, `Posted ledger entries expected at least 2, found ${postedLedgerEntries}`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test database verification failed: ${message}`)
  }
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
