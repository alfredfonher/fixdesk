import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_PORT = Number(process.env.PORT || 3000)

export function toFileUrl(filePath) {
  return `file:${filePath.split(path.sep).join('/')}`
}

export function findExistingPath(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return candidates[0]
}

export function getRuntimePaths(app) {
  const appRoot = app.isPackaged ? process.resourcesPath : process.cwd()
  const standaloneRoot = findExistingPath([
    path.join(appRoot, '.next', 'standalone'),
    path.join(appRoot, 'app', '.next', 'standalone'),
    path.join(process.cwd(), '.next', 'standalone'),
  ])

  const standaloneServerPath = findExistingPath([
    path.join(standaloneRoot, 'server.js'),
    path.join(process.resourcesPath, '.next', 'standalone', 'server.js'),
    path.join(process.cwd(), '.next', 'standalone', 'server.js'),
  ])

  const staticDir = findExistingPath([
    path.join(appRoot, '.next', 'static'),
    path.join(process.cwd(), '.next', 'static'),
  ])

  const publicDir = findExistingPath([
    path.join(appRoot, 'public'),
    path.join(process.cwd(), 'public'),
  ])

  const userDataDir = app.getPath('userData')
  const userDataDbDir = path.join(userDataDir, 'db')
  const databasePath = path.join(userDataDir, 'db', 'custom.db')
  const bundledDatabasePath = findExistingPath([
    path.join(appRoot, 'db', 'custom.db'),
    path.join(process.resourcesPath, 'db', 'custom.db'),
    path.join(process.cwd(), 'db', 'custom.db'),
  ])

  return {
    appRoot,
    bundledDatabasePath,
    databaseDir: userDataDbDir,
    staticDir,
    publicDir,
    standaloneRoot,
    standaloneServerPath,
    userDataDir,
    databasePath,
    databaseUrl: toFileUrl(databasePath),
    rendererUrl: process.env.ELECTRON_START_URL || `http://127.0.0.1:${DEFAULT_PORT}`,
  }
}

export function ensureDatabase(runtime) {
  fs.mkdirSync(runtime.databaseDir, { recursive: true })

  if (!fs.existsSync(runtime.databasePath) && fs.existsSync(runtime.bundledDatabasePath)) {
    fs.copyFileSync(runtime.bundledDatabasePath, runtime.databasePath)
  }
}

export function isProductionBoot(app) {
  return app.isPackaged || process.env.ELECTRON_FORCE_PROD_BOOT === '1'
}

export { DEFAULT_PORT }
