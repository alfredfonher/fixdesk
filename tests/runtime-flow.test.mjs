import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(testDir, '..')
const prismaBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma')
const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const standaloneServer = path.join(rootDir, '.next', 'standalone', 'server.js')

test('clean runtime flow supports bootstrap, login, and backup export over HTTP', { timeout: 60_000 }, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'techfix-runtime-flow-'))
  const dbPath = path.join(tempDir, 'custom.test.db')
  const databaseUrl = toSqliteUrl(dbPath)
  const port = await getFreePort()
  let app

  try {
    pushSchema(databaseUrl)

    const useStandalone = fs.existsSync(standaloneServer)
    if (useStandalone) {
      app = spawn('node', ['server.js'], {
        cwd: path.dirname(standaloneServer),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          PORT: String(port),
          HOSTNAME: '127.0.0.1',
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      })
    } else {
      app = spawn(pnpmBin, ['exec', 'next', 'dev', '-p', String(port), '-H', '127.0.0.1'], {
        cwd: rootDir,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          NEXT_TELEMETRY_DISABLED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      })
    }

    const baseUrl = `http://127.0.0.1:${port}`
    await waitForHttp(`${baseUrl}/api/bootstrap/status`, app)

    const initialStatus = await getJson(`${baseUrl}/api/bootstrap/status`)
    assert.deepEqual(initialStatus, {
      needsBootstrap: true,
      hasUsers: false,
      completed: false,
    })

    const bootstrap = await postJson(`${baseUrl}/api/bootstrap/complete`, {
      username: 'runtime.admin',
      displayName: 'Runtime Admin',
      password: 'RuntimeAdmin123!',
      businessFocus: 'laptops',
      currency: 'CUP',
      exchangeRate: '25',
    })
    assert.equal(bootstrap.status, 200)
    assert.deepEqual(bootstrap.body, { success: true })

    const completedStatus = await getJson(`${baseUrl}/api/bootstrap/status`)
    assert.deepEqual(completedStatus, {
      needsBootstrap: false,
      hasUsers: true,
      completed: true,
    })

    const login = await postJson(`${baseUrl}/api/auth/login`, {
      username: 'runtime.admin',
      password: 'RuntimeAdmin123!',
    })
    assert.equal(login.status, 200)
    assert.equal(login.body.user.username, 'runtime.admin')

    const cookie = getCookieHeader(login.response)
    assert.match(cookie, /^techfix_session_token=/)

    const backupResponse = await fetch(`${baseUrl}/api/backup`, {
      headers: { Cookie: cookie },
    })
    const backup = await backupResponse.json()

    assert.equal(backupResponse.status, 200)
    assert.equal(backup.version, '2.0')
    assert.equal(backup.app, 'TechFix Pro')
    assert.equal(Array.isArray(backup.data.clients), true)
    assert.equal(Array.isArray(backup.data.settings), true)
    assert.equal(backup.data.settings.some((setting) => setting.key === 'firstRunCompleted' && setting.value === 'true'), true)
  } finally {
    if (app) {
      await stopProcess(app)
    }
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('backup import restores data correctly via replace mode', { timeout: 60_000 }, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'techfix-runtime-restore-'))
  const dbPath = path.join(tempDir, 'custom.test.db')
  const databaseUrl = toSqliteUrl(dbPath)
  const port = await getFreePort()
  let app

  try {
    pushSchema(databaseUrl)

    const useStandalone = fs.existsSync(standaloneServer)
    if (useStandalone) {
      app = spawn('node', ['server.js'], {
        cwd: path.dirname(standaloneServer),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          PORT: String(port),
          HOSTNAME: '127.0.0.1',
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      })
    } else {
      app = spawn(pnpmBin, ['exec', 'next', 'dev', '-p', String(port), '-H', '127.0.0.1'], {
        cwd: rootDir,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          NEXT_TELEMETRY_DISABLED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      })
    }

    const baseUrl = `http://127.0.0.1:${port}`
    await waitForHttp(`${baseUrl}/api/bootstrap/status`, app)

    const bootstrap = await postJson(`${baseUrl}/api/bootstrap/complete`, {
      username: 'restore.admin',
      displayName: 'Restore Admin',
      password: 'RestoreAdmin123!',
      businessFocus: 'laptops',
      currency: 'CUP',
      exchangeRate: '25',
    })
    assert.equal(bootstrap.status, 200)

    const login = await postJson(`${baseUrl}/api/auth/login`, {
      username: 'restore.admin',
      password: 'RestoreAdmin123!',
    })
    assert.equal(login.status, 200)
    const cookie = getCookieHeader(login.response)

    // Export initial backup (contains bootstrap settings and admin user)
    const exportResponse = await fetch(`${baseUrl}/api/backup`, {
      headers: { Cookie: cookie },
    })
    const backup = await exportResponse.json()
    assert.equal(exportResponse.status, 200)
    assert.equal(backup.version, '2.0')

    // Import backup using replace mode (should restore the same data)
    const importResponse = await fetch(`${baseUrl}/api/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ data: backup.data, mode: 'replace' }),
    })
    const importResult = await importResponse.json()
    assert.equal(importResponse.status, 200)
    assert.equal(importResult.success, true)

    // Verify data was restored: check settings exist
    const verifyResponse = await fetch(`${baseUrl}/api/backup`, {
      headers: { Cookie: cookie },
    })
    const restoredBackup = await verifyResponse.json()
    assert.equal(verifyResponse.status, 200)
    assert.equal(restoredBackup.data.settings.some(s => s.key === 'firstRunCompleted' && s.value === 'true'), true)
    assert.equal(restoredBackup.data.settings.some(s => s.key === 'businessFocus' && s.value === 'laptops'), true)
    assert.equal(restoredBackup.data.settings.some(s => s.key === 'currency' && s.value === 'CUP'), true)

    // Verify user still exists (users are NOT deleted in replace mode, only restored from backup if included)
    const relogin = await postJson(`${baseUrl}/api/auth/login`, {
      username: 'restore.admin',
      password: 'RestoreAdmin123!',
    })
    assert.equal(relogin.status, 200)
    assert.equal(relogin.body.user.username, 'restore.admin')
  } finally {
    if (app) {
      await stopProcess(app)
    }
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

function pushSchema(databaseUrl) {
  const result = spawnSync(
    prismaBin,
    ['db', 'push', '--schema', path.join('prisma', 'schema.prisma'), '--skip-generate'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'pipe',
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  )

  if (result.status !== 0) {
    throw new Error(`Failed to push schema to runtime test database:\n${result.stderr || result.stdout}`)
  }
}

async function getJson(url) {
  const response = await fetch(url)
  const body = await response.json()

  assert.equal(response.status, 200)
  return body
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    response,
    status: response.status,
    body: await response.json(),
  }
}

function getCookieHeader(response) {
  const setCookie = response.headers.get('set-cookie')
  assert.ok(setCookie, 'Login response must set a session cookie')

  return setCookie.split(';')[0]
}

async function waitForHttp(url, app) {
  const deadline = Date.now() + 45_000
  let output = ''

  app.stdout.on('data', (chunk) => {
    output += chunk.toString()
  })
  app.stderr.on('data', (chunk) => {
    output += chunk.toString()
  })

  while (Date.now() < deadline) {
    if (app.exitCode !== null) {
      throw new Error(`Runtime test server exited early with code ${app.exitCode}:\n${output}`)
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Runtime test server did not become ready:\n${output}`)
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      resolve()
    }, 5_000)

    child.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : null

      server.close(() => {
        if (port) {
          resolve(port)
        } else {
          reject(new Error('Failed to allocate a free port'))
        }
      })
    })
    server.on('error', reject)
  })
}

function toSqliteUrl(filePath) {
  return `file:${filePath.split(path.sep).join('/')}`
}
