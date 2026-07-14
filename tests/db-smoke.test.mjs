import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { buildBackupArtifact } from '../src/lib/backup-artifact.ts'
import { verifyPassword } from '../src/lib/auth-utils.ts'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(testDir, '..')
const testDbPath = path.join(rootDir, 'db', 'test', 'custom.test.db')

test('seeded test database exposes expected smoke data', async () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: toSqliteUrl(testDbPath) },
    },
  })

  try {
    const setupComplete = await db.settings.findUnique({ where: { key: 'setupComplete' } })
    const adminUser = await db.user.findUnique({ where: { username: 'admin.test' } })

    assert.equal(setupComplete?.value, 'true')
    assert.equal(adminUser?.role, 'admin')
  } finally {
    await db.$disconnect()
  }
})

test('seeded test database reflects completed bootstrap state', async () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: toSqliteUrl(testDbPath) },
    },
  })

  try {
    const [userCount, firstRunCompleted] = await Promise.all([
      db.user.count(),
      db.settings.findUnique({ where: { key: 'firstRunCompleted' } }),
    ])

    assert.equal(userCount > 0, true)
    assert.equal(firstRunCompleted?.value, 'true')
  } finally {
    await db.$disconnect()
  }
})

test('backup artifact keeps deterministic export metadata and payload shape', () => {
  const artifact = buildBackupArtifact(
    {
      clients: [{ id: 'test-client-primary' }],
      settings: [{ key: 'setupComplete', value: 'true' }],
    },
    new Date('2026-01-15T10:00:00.000Z'),
  )

  assert.deepEqual(artifact, {
    version: '2.0',
    exportDate: '2026-01-15T10:00:00.000Z',
    app: 'TechFix Pro',
    data: {
      clients: [{ id: 'test-client-primary' }],
      settings: [{ key: 'setupComplete', value: 'true' }],
    },
  })
})

test('seeded bootstrap admin keeps a valid legacy password hash for login upgrade', async () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: toSqliteUrl(testDbPath) },
    },
  })

  try {
    const adminUser = await db.user.findUnique({ where: { username: 'admin.test' } })

    assert.equal(adminUser?.isActive, true)
    assert.equal(adminUser?.passwordHash, legacyPasswordHash('AdminTest123!'))
    assert.match(adminUser.passwordHash, /^[a-f0-9]{64}$/i)
    assert.equal(adminUser.passwordHash.startsWith('$2'), false)
  } finally {
    await db.$disconnect()
  }
})

test('seeded bootstrap admin credentials match login password verification', async () => {
  const db = new PrismaClient({
    datasources: {
      db: { url: toSqliteUrl(testDbPath) },
    },
  })

  try {
    const adminUser = await db.user.findUnique({ where: { username: 'admin.test' } })

    assert.equal(adminUser?.isActive, true)
    assert.equal(verifyPassword('AdminTest123!', adminUser.passwordHash), true)
    assert.equal(verifyPassword('wrong-password', adminUser.passwordHash), false)
  } finally {
    await db.$disconnect()
  }
})

function legacyPasswordHash(password) {
  return createHash('sha256').update(`${password}techfix-pro-salt-2024`).digest('hex')
}

function toSqliteUrl(filePath) {
  return `file:${filePath.split(path.sep).join('/')}`
}
