import fs from 'node:fs'
import path from 'node:path'

const scope = process.argv[2]
const platform = process.argv[3]

const outputDirByScope = {
  base: path.join(process.cwd(), 'dist-electron'),
  cam: path.join(process.cwd(), 'dist-electron', 'cam'),
}

const patternsByPlatform = {
  linux: ['.deb', '.deb.blockmap'],
  win: ['.exe', '.exe.blockmap', '.nupkg', 'RELEASES'],
}

const outputDir = outputDirByScope[scope]
const patterns = patternsByPlatform[platform]

if (!outputDir || !patterns) {
  console.error('[cleanup-cam-artifacts] Usage: node scripts/cleanup-cam-artifacts.mjs <base|cam> <linux|win>')
  process.exit(1)
}

if (!fs.existsSync(outputDir)) {
  console.log(`[cleanup-cam-artifacts] Skipped: ${outputDir} does not exist`)
  process.exit(0)
}

let removed = 0

for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue

  const name = entry.name
  if (!patterns.some((suffix) => name === suffix || name.endsWith(suffix))) continue

  fs.rmSync(path.join(outputDir, name), { force: true })
  removed++
  console.log(`[cleanup-cam-artifacts] Removed ${name}`)
}

console.log(`[cleanup-cam-artifacts] Removed ${removed} stale ${scope.toUpperCase()} ${platform} artifact(s) from ${outputDir}`)
