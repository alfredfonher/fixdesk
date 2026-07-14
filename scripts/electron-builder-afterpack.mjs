import fs from 'node:fs'
import path from 'node:path'

/**
 * electron-builder afterPack hook.
 *
 * Materializes a flat (npm-style) node_modules tree inside the packaged
 * `.next/standalone/node_modules` directory by walking the runtime
 * dependency graph of every top-level package that Next's tracer placed
 * there.
 *
 * Why this exists
 * ---------------
 * electron-builder copies `.next/standalone` via `extraResources`, but
 * the standalone tree produced by Next + pnpm is full of symlinks that
 * point into `node_modules/.pnpm/<pkg>@<ver>/node_modules/...`. Two
 * problems surface from that:
 *
 *   1) Symlinks get dropped silently when electron-builder copies the
 *      tree. The unpacked app then fails to boot with
 *      `Cannot find module 'next'` etc.
 *   2) Even after dereferencing each top-level symlink, the *siblings*
 *      of the resolved package (its direct runtime deps under pnpm's
 *      isolated layout) are not copied. Node module resolution then
 *      fails one transitive package at a time — first `next`, then
 *      `@swc/helpers`, then `@next/env`, and so on (whack-a-mole).
 *
 * Strategy
 * --------
 * Treat the `.next/standalone/node_modules` entries as a seed set and
 * BFS the dependency graph using each package's own `package.json`
 * (`dependencies` + `optionalDependencies`). Each visited package is
 * copied once, with symlinks dereferenced, into the packaged target
 * as a flat (npm-style) `node_modules/<name>` entry.
 *
 * A dependency is resolved by, in order:
 *   1) The seed location under `.next/standalone/node_modules/<name>`.
 *   2) The parent's pnpm sibling directory
 *      (`<parent-real-dir>/../<name>` for unscoped, two-up for scoped).
 *      This gives us the exact version the parent was linked against.
 *   3) A fallback scan of `node_modules/.pnpm/<name-slug>@*` for cases
 *      where the parent is not under `.pnpm` (e.g. seeded directly).
 *
 * Optional dependencies that cannot be resolved (e.g. cross-platform
 * native binaries like `@next/swc-darwin-arm64` on a Linux host) are
 * skipped silently. Required dependencies that cannot be resolved are
 * logged loudly so we notice and fix the root cause.
 */
export default async function afterPack(context) {
  const repoRoot = process.cwd()
  const source = path.join(repoRoot, '.next', 'standalone', 'node_modules')
  const standaloneRoot = path.join(context.appOutDir, 'resources', '.next', 'standalone')
  const target = path.join(standaloneRoot, 'node_modules')
  const pnpmStore = path.join(repoRoot, 'node_modules', '.pnpm')

  if (!fs.existsSync(source)) {
    console.warn(`[afterPack] Skipped: source not found at ${source}`)
    return
  }

  if (!fs.existsSync(standaloneRoot)) {
    console.warn(`[afterPack] Skipped: standalone root not found at ${standaloneRoot}`)
    return
  }

  fs.rmSync(target, { recursive: true, force: true })
  fs.mkdirSync(target, { recursive: true })

  const seen = new Set()
  const queue = []

  for (const name of listTopLevelPackages(source)) {
    queue.push({ name, hintDir: path.join(source, name), parentRealDir: null, optional: false })
  }

  let copied = 0
  const missingRequired = []

  while (queue.length > 0) {
    const item = queue.shift()
    const { name, hintDir, parentRealDir, optional } = item
    if (seen.has(name)) continue

    const realDir = resolvePackageRealDir({ name, hintDir, parentRealDir, pnpmStore })
    if (!realDir) {
      if (!optional) {
        missingRequired.push(name)
      }
      continue
    }

    seen.add(name)
    const targetDir = path.join(target, name)
    fs.mkdirSync(path.dirname(targetDir), { recursive: true })
    copyDirDereferencing(realDir, targetDir)
    copied++

    for (const dep of readRuntimeDeps(realDir)) {
      if (seen.has(dep.name)) continue
      queue.push({ name: dep.name, hintDir: null, parentRealDir: realDir, optional: dep.optional })
    }
  }

  materializePrismaRuntime({ repoRoot, target, standaloneRoot })

  console.log(
    `[afterPack] Materialized ${copied} packages into ${target} (symlinks dereferenced, transitive runtime deps included)`,
  )

  if (missingRequired.length > 0) {
    console.warn(
      `[afterPack] WARNING: ${missingRequired.length} required runtime dep(s) could not be resolved: ${missingRequired.join(', ')}`,
    )
  }
}

function materializePrismaRuntime({ repoRoot, target, standaloneRoot }) {
  const prismaClientRealDir = safeRealpath(path.join(repoRoot, 'node_modules', '@prisma', 'client'))

  if (!prismaClientRealDir) {
    console.warn('[afterPack] Prisma client not found in repo node_modules; skipping Prisma runtime materialization')
    return
  }

  const prismaClientTargets = [
    path.join(target, '@prisma', 'client'),
    path.join(standaloneRoot, '.next', 'node_modules', '@prisma', 'client'),
  ]

  for (const prismaClientTarget of prismaClientTargets) {
    fs.rmSync(prismaClientTarget, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(prismaClientTarget), { recursive: true })
    copyDirDereferencing(prismaClientRealDir, prismaClientTarget)
    console.log(`[afterPack] Materialized Prisma client into ${prismaClientTarget}`)
  }

  for (const aliasName of discoverPrismaClientAliases(path.join(repoRoot, '.next', 'standalone', '.next', 'server'))) {
    const prismaAliasTargets = [
      path.join(target, '@prisma', aliasName),
      path.join(standaloneRoot, '.next', 'node_modules', '@prisma', aliasName),
    ]

    for (const prismaAliasTarget of prismaAliasTargets) {
      fs.rmSync(prismaAliasTarget, { recursive: true, force: true })
      fs.mkdirSync(path.dirname(prismaAliasTarget), { recursive: true })
      copyDirDereferencing(prismaClientRealDir, prismaAliasTarget)
      console.log(`[afterPack] Materialized Prisma client alias into ${prismaAliasTarget}`)
    }
  }

  const generatedClientDir = path.join(
    path.dirname(path.dirname(prismaClientRealDir)),
    '.prisma',
    'client',
  )

  if (fs.existsSync(generatedClientDir)) {
    const generatedClientTargets = [
      path.join(target, '.prisma', 'client'),
      path.join(standaloneRoot, '.next', 'node_modules', '.prisma', 'client'),
    ]

    for (const generatedClientTarget of generatedClientTargets) {
      fs.rmSync(generatedClientTarget, { recursive: true, force: true })
      fs.mkdirSync(path.dirname(generatedClientTarget), { recursive: true })
      copyDirDereferencing(generatedClientDir, generatedClientTarget)
      console.log(`[afterPack] Materialized Prisma generated client into ${generatedClientTarget}`)
    }
  } else {
    console.warn(`[afterPack] Prisma generated client not found at ${generatedClientDir}`)
  }
}

function discoverPrismaClientAliases(serverDir) {
  if (!fs.existsSync(serverDir)) return []

  const aliases = new Set()
  const pattern = /@prisma\/client-([a-z0-9]+)/g

  walkFiles(serverDir, (filePath) => {
    if (!filePath.endsWith('.js')) return
    const source = fs.readFileSync(filePath, 'utf8')
    for (const match of source.matchAll(pattern)) {
      aliases.add(`client-${match[1]}`)
    }
  })

  return [...aliases]
}

function walkFiles(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, visit)
    } else if (entry.isFile()) {
      visit(fullPath)
    }
  }
}

function listTopLevelPackages(dir) {
  const names = []
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue
    const entryPath = path.join(dir, entry)
    let stat
    try {
      stat = fs.statSync(entryPath)
    } catch {
      continue
    }
    if (!stat.isDirectory()) continue

    if (entry.startsWith('@')) {
      for (const sub of fs.readdirSync(entryPath)) {
        names.push(`${entry}/${sub}`)
      }
    } else {
      names.push(entry)
    }
  }
  return names
}

function resolvePackageRealDir({ name, hintDir, parentRealDir, pnpmStore }) {
  if (hintDir && fs.existsSync(hintDir)) {
    return fs.realpathSync(hintDir)
  }

  if (parentRealDir) {
    const parentNodeModules = nodeModulesDirOf(parentRealDir)
    const sibling = path.join(parentNodeModules, name)
    if (fs.existsSync(sibling)) {
      return fs.realpathSync(sibling)
    }
  }

  if (fs.existsSync(pnpmStore)) {
    const slug = name.replace('/', '+')
    const prefix = `${slug}@`
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (!entry.startsWith(prefix)) continue
      const candidate = path.join(pnpmStore, entry, 'node_modules', name)
      if (fs.existsSync(candidate)) {
        return fs.realpathSync(candidate)
      }
    }
  }

  return null
}

function safeRealpath(filePath) {
  if (!fs.existsSync(filePath)) return null
  return fs.realpathSync(filePath)
}

function nodeModulesDirOf(packageRealDir) {
  const parent = path.dirname(packageRealDir)
  if (path.basename(parent).startsWith('@')) {
    return path.dirname(parent)
  }
  return parent
}

function readRuntimeDeps(packageRealDir) {
  const pkgJsonPath = path.join(packageRealDir, 'package.json')
  if (!fs.existsSync(pkgJsonPath)) return []
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  } catch (err) {
    console.warn(`[afterPack] Could not parse ${pkgJsonPath}: ${err.message}`)
    return []
  }
  const deps = []
  for (const name of Object.keys(pkg.dependencies || {})) {
    deps.push({ name, optional: false })
  }
  for (const name of Object.keys(pkg.optionalDependencies || {})) {
    deps.push({ name, optional: true })
  }
  return deps
}

function copyDirDereferencing(source, target) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source)) {
    copyEntryDereferencing(path.join(source, entry), path.join(target, entry))
  }
}

function copyEntryDereferencing(source, target) {
  const lstat = fs.lstatSync(source)

  if (lstat.isSymbolicLink()) {
    const realPath = fs.realpathSync(source)
    const realStat = fs.statSync(realPath)
    if (realStat.isDirectory()) {
      copyDirDereferencing(realPath, target)
    } else {
      fs.copyFileSync(realPath, target)
    }
    return
  }

  if (lstat.isDirectory()) {
    copyDirDereferencing(source, target)
  } else {
    fs.copyFileSync(source, target)
  }
}
