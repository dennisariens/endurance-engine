const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const isDev = process.env.AERION_ELECTRON_DEV === '1'
const AERION_URL = 'http://127.0.0.1:5174/'
const AERION_PROJECT_DIR = process.env.AERION_PROJECT_DIR || '/Users/dennisariens/endurance-engine'
let aerionServerProcess

function appPath(...segments) {
  return path.join(app.getAppPath(), ...segments)
}

async function isAerionServerReady() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 900)
    const response = await fetch(AERION_URL, { signal: controller.signal })
    clearTimeout(timeout)
    return response.ok
  } catch (_error) {
    return false
  }
}

async function waitForAerionServer(timeoutMs = 15000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await isAerionServerReady()) return true
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  return false
}

async function ensureAerionServer() {
  if (isDev) return true
  if (await isAerionServerReady()) return true
  if (!fs.existsSync(path.join(AERION_PROJECT_DIR, 'scripts', 'start-aerion.sh'))) return false

  aerionServerProcess = spawn('/bin/bash', ['scripts/start-aerion.sh'], {
    cwd: AERION_PROJECT_DIR,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}`,
    },
    stdio: 'ignore',
    detached: false,
  })
  aerionServerProcess.on('exit', () => { aerionServerProcess = undefined })
  return await waitForAerionServer()
}

async function createWindow() {
  const iconPath = appPath('build', 'icon.icns')
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    title: 'AERION',
    backgroundColor: '#03060b',
    icon: iconPath,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.once('ready-to-show', () => {
    window.show()
    window.focus()
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const serverReady = await ensureAerionServer()
  if (serverReady) {
    window.loadURL(AERION_URL)
  } else {
    const indexPath = appPath('dist', 'index.html')
    if (!fs.existsSync(indexPath)) {
      window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<body style="background:#03060b;color:#e5eefc;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:48px"><h1>AERION build missing</h1><p>Run npm run build before opening the desktop app.</p></body>'))
      return
    }
    window.loadFile(indexPath)
  }
}

function navigateTo(screen) {
  const windows = BrowserWindow.getAllWindows()
  const window = windows[0]
  if (!window) return
  window.show()
  window.focus()
  window.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('aerion:navigate', { detail: ${JSON.stringify(screen)} }))`)
}

function buildMenu() {
  const template = [
    {
      label: 'AERION',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Race Control',
      submenu: [
        { label: 'Home / Mission Control', accelerator: 'CommandOrControl+1', click: () => navigateTo('home') },
        { label: 'Performance', accelerator: 'CommandOrControl+2', click: () => navigateTo('performance') },
        { label: 'Races', accelerator: 'CommandOrControl+3', click: () => navigateTo('races') },
        { label: 'Training', accelerator: 'CommandOrControl+4', click: () => navigateTo('training') },
        { label: 'Recovery', accelerator: 'CommandOrControl+5', click: () => navigateTo('recovery') },
        { label: 'Goals / Path', accelerator: 'CommandOrControl+6', click: () => navigateTo('goals') },
        { label: 'AI Coach', accelerator: 'CommandOrControl+7', click: () => navigateTo('coach') },
        { type: 'separator' },
        { label: 'Settings / Data', accelerator: 'CommandOrControl+,', click: () => navigateTo('settings') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.setName('AERION')
app.whenReady().then(async () => {
  buildMenu()
  await createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (aerionServerProcess) {
    aerionServerProcess.kill()
    aerionServerProcess = undefined
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
