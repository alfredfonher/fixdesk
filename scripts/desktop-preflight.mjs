import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const packageJsonPath = path.join(rootDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredNodeMajor = 22
const actualNodeMajor = Number(process.versions.node.split('.')[0])

if (actualNodeMajor < requiredNodeMajor) {
  throw new Error(
    `Node.js ${requiredNodeMajor} or newer is required for the desktop packaging flow. Found ${process.versions.node}.`,
  )
}

if (actualNodeMajor !== requiredNodeMajor) {
  console.warn(
    `GitHub Actions is pinned to Node.js ${requiredNodeMajor}; continuing with ${process.versions.node}.`,
  )
}

const expectedPnpm = getExpectedPnpmVersion(packageJson.packageManager)
const actualPnpm = getPnpmVersion()

if (actualPnpm !== expectedPnpm) {
  throw new Error(
    `pnpm ${expectedPnpm} is required for the desktop packaging flow. Found ${actualPnpm || 'unknown'}.`,
  )
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required before packaging. Set it to file:./test.db to mirror GitHub Actions.',
  )
}

if (!process.env.DATABASE_URL.startsWith('file:')) {
  throw new Error(
    `DATABASE_URL must point at a sqlite file URL for packaging. Found ${process.env.DATABASE_URL}.`,
  )
}

const target = resolveTarget(process.argv.slice(2))
const build = packageJson.build || {}

assertTargetConfig(target, build)
reportPlatformCompatibility(target)

console.log(`Desktop packaging preflight passed (target: ${target}).`)

function resolveTarget(argv) {
  let explicit = null
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--target' && i + 1 < argv.length) {
      explicit = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--target=')) {
      explicit = arg.slice('--target='.length)
    }
  }

  const valid = ['linux', 'win', 'all']
  if (explicit && !valid.includes(explicit)) {
    throw new Error(
      `Unknown --target "${explicit}". Expected one of: ${valid.join(', ')}.`,
    )
  }

  if (explicit) return explicit

  if (process.platform === 'linux') return 'linux'
  if (process.platform === 'win32') return 'win'
  return 'linux'
}

function assertTargetConfig(target, build) {
  if (target === 'linux' || target === 'all') {
    const linuxTargets = build.linux && build.linux.target
    if (!Array.isArray(linuxTargets) || linuxTargets.length === 0) {
      throw new Error(
        'build.linux.target must be configured in package.json to package Linux.',
      )
    }
  }

  if (target === 'win' || target === 'all') {
    const winTargets = build.win && build.win.target
    if (!Array.isArray(winTargets) || winTargets.length === 0) {
      throw new Error(
        'build.win.target must be configured in package.json to package Windows.',
      )
    }
  }
}

function reportPlatformCompatibility(target) {
  if (target === 'win' && process.platform !== 'win32') {
    const wine = detectWine()
    if (wine) {
      console.warn(
        `[preflight] Windows portable packaging on ${process.platform}: requires Windows ` +
          `or a Wine-capable environment. Wine was detected at ${wine}, so electron-builder ` +
          `may succeed, but this is not an officially supported configuration.`,
      )
    } else {
      console.warn(
        `[preflight] Windows portable packaging on ${process.platform}: this target requires ` +
          `either running on Windows or a Wine-capable environment. Wine was not detected on PATH; ` +
          `the build is likely to fail.`,
      )
    }
  }

  if (target === 'linux' && process.platform === 'win32') {
    console.warn(
      '[preflight] Linux .deb packaging on Windows: not natively supported by electron-builder. ' +
        'Run this on a Linux host or inside WSL.',
    )
  }

  if (target === 'linux' && process.platform === 'linux') {
    console.log('[preflight] Linux .deb packaging on a Linux host: supported.')
  }

  if (target === 'win' && process.platform === 'win32') {
    console.log('[preflight] Windows portable packaging on Windows: supported.')
  }
}

function detectWine() {
  const result = spawnSync('which', ['wine'], { encoding: 'utf8' })
  if (result.status === 0) {
    const path = result.stdout.trim().split('\n')[0]
    return path || null
  }
  return null
}

function getExpectedPnpmVersion(packageManager) {
  if (!packageManager || !packageManager.startsWith('pnpm@')) {
    throw new Error('packageManager must declare pnpm@<version> in package.json.')
  }

  return packageManager.slice('pnpm@'.length)
}

function getPnpmVersion() {
  const result = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['--version'],
    {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  )

  if (result.error) {
    throw new Error(`Unable to execute pnpm: ${result.error.message}`)
  }

  if (result.status !== 0) {
    return null
  }

  return result.stdout.trim()
}
