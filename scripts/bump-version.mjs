import fs from 'node:fs'
import path from 'node:path'

const packageJsonPath = path.join(process.cwd(), 'package.json')
const bumpType = process.argv[2] || 'patch'

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('[bump-version] Usage: node scripts/bump-version.mjs [patch|minor|major]')
  process.exit(1)
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const currentVersion = packageJson.version
const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/)

if (!match) {
  console.error(`[bump-version] Unsupported version format: ${currentVersion}`)
  process.exit(1)
}

let [, major, minor, patch] = match
let nextVersion

if (bumpType === 'major') {
  nextVersion = `${Number(major) + 1}.0.0`
} else if (bumpType === 'minor') {
  nextVersion = `${major}.${Number(minor) + 1}.0`
} else {
  nextVersion = `${major}.${minor}.${Number(patch) + 1}`
}

packageJson.version = nextVersion
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

console.log(`[bump-version] ${currentVersion} -> ${nextVersion}`)
