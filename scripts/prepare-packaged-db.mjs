import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const prismaDir = path.join(rootDir, 'prisma')
const packagedDbDir = path.join(rootDir, 'db')
const packagedDbPath = path.join(packagedDbDir, 'custom.db')
const packagedDbUrl = toSqliteUrl(packagedDbPath, prismaDir)
const prismaBin = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
)

fs.mkdirSync(packagedDbDir, { recursive: true })
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  fs.rmSync(`${packagedDbPath}${suffix}`, { force: true })
}
fs.rmSync(path.join(prismaDir, 'db'), { recursive: true, force: true })

const result = spawnSync(
  prismaBin,
  ['db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: packagedDbUrl,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

if (result.status !== 0) {
  throw new Error('Failed to prepare packaged database')
}

function toSqliteUrl(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath)
  const normalizedRelativePath = relativePath.split(path.sep).join('/')

  if (relativePath && !path.isAbsolute(relativePath)) {
    return normalizedRelativePath.startsWith('.')
      ? `file:${normalizedRelativePath}`
      : `file:./${normalizedRelativePath}`
  }

  return `file:${filePath.split(path.sep).join('/')}`
}
