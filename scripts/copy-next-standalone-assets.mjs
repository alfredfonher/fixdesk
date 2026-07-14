import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const standaloneDir = path.join(rootDir, '.next', 'standalone')
const staticSource = path.join(rootDir, '.next', 'static')
const publicSource = path.join(rootDir, 'public')
const staticTarget = path.join(standaloneDir, '.next', 'static')
const publicTarget = path.join(standaloneDir, 'public')

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) return

  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.rmSync(target, { recursive: true, force: true })
  fs.cpSync(source, target, { recursive: true })
}

if (!fs.existsSync(standaloneDir)) {
  throw new Error(`Missing Next standalone output at ${standaloneDir}. Run next build first.`)
}

copyDirectory(staticSource, staticTarget)
copyDirectory(publicSource, publicTarget)
