import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { BrowserWindow, app, shell } from 'electron'
import {
  DEFAULT_PORT,
  ensureDatabase,
  getRuntimePaths,
  isProductionBoot,
} from './runtime.mjs'

let backendProcess = null
let runtimeState = null
const SESSION_COOKIE_NAME = 'techfix_session_token'
let isQuittingAfterLogout = false

if (!app.isPackaged && process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('disable-gpu-compositing')
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForUrl(url, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (response.ok) return
    } catch {
      // Retry until the local server is ready.
    }

    await wait(500)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

function startStandaloneServer(runtime) {
  if (!fs.existsSync(runtime.standaloneServerPath)) {
    return null
  }

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    HOSTNAME: process.env.HOSTNAME || '127.0.0.1',
    NODE_ENV: 'production',
    PORT: String(DEFAULT_PORT),
    DATABASE_URL: process.env.DATABASE_URL || runtime.databaseUrl,
  }

  const child = spawn(process.execPath, [runtime.standaloneServerPath], {
    env,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  })

  child.on('exit', (code) => {
    if (code && !app.isQuiting) {
      console.error(`Standalone server exited with code ${code}`)
    }
  })

  backendProcess = child
  return child
}

async function logoutWindowSession(window) {
  if (!runtimeState) return

  const sessionCookies = await window.webContents.session.cookies.get({
    name: SESSION_COOKIE_NAME,
  })

  const sessionToken = sessionCookies[0]?.value

  if (sessionToken) {
    try {
      await fetch(new URL('/api/auth/logout', runtimeState.rendererUrl), {
        method: 'POST',
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
        },
      })
    } catch (error) {
      console.error('Logout on close request failed:', error)
    }
  }

  try {
    await window.webContents.session.cookies.remove(runtimeState.rendererUrl, SESSION_COOKIE_NAME)
  } catch (error) {
    console.error('Cookie cleanup on close failed:', error)
  }
}

async function logoutAllWindowSessions() {
  const windows = BrowserWindow.getAllWindows()
  await Promise.all(windows.map((window) => logoutWindowSession(window)))
}

function bindWindowCloseLogout(window) {
  let isClosingAfterLogout = false

  window.on('close', (event) => {
    if (isClosingAfterLogout || isQuittingAfterLogout) {
      return
    }

    event.preventDefault()
    isClosingAfterLogout = true

    void logoutWindowSession(window).finally(() => {
      if (!window.isDestroyed()) {
        window.destroy()
      }

      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1280,
    minHeight: 800,
    title: 'FixDesk',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    if (runtimeState && url !== runtimeState.rendererUrl) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  bindWindowCloseLogout(window)

  return window
}

async function createAndLoadWindow(runtime) {
  const window = createWindow()
  await window.loadURL(runtime.rendererUrl)
  return window
}

async function bootstrap() {
  runtimeState = getRuntimePaths(app)
  ensureDatabase(runtimeState)

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = runtimeState.databaseUrl
  }

  if (isProductionBoot(app) && !process.env.ELECTRON_START_URL) {
    if (!fs.existsSync(runtimeState.standaloneServerPath)) {
      throw new Error(
        `Missing Next standalone server at ${runtimeState.standaloneServerPath}`,
      )
    }

    startStandaloneServer(runtimeState)
    await waitForUrl(runtimeState.rendererUrl)
  }

  await createAndLoadWindow(runtimeState)
}

app.on('before-quit', (event) => {
  if (!isQuittingAfterLogout) {
    event.preventDefault()
    isQuittingAfterLogout = true

    void logoutAllWindowSessions().finally(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill()
      }

      app.quit()
    })
    return
  }

  app.isQuiting = true
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && runtimeState) {
    void createAndLoadWindow(runtimeState)
  }
})

app.whenReady().then(() => {
  bootstrap().catch((error) => {
    console.error(error)
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
