import {
  app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme,
} from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import Store from 'electron-store'

const store = new Store()
const isDev = !app.isPackaged

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0) }

let mainWindow: BrowserWindow | null = null

function createWindow(filePath?: string) {
  const bounds = store.get('windowBounds', { width: 1400, height: 900 }) as {
    width: number; height: number; x?: number; y?: number
  }

  mainWindow = new BrowserWindow({
    ...bounds, minWidth: 920, minHeight: 620,
    frame: false, backgroundColor: '#080810', show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })

  isDev
    ? mainWindow.loadURL('http://localhost:5173')
    : mainWindow.loadFile(join(__dirname, '../dist/index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
    if (filePath) mainWindow?.webContents.send('open-file-path', filePath)
  })

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move',   saveBounds)
  mainWindow.on('closed', () => { mainWindow = null })

  setupMenu()
  setInterval(() => mainWindow?.webContents.send('auto-save-trigger'), 30_000)
}

function getIconPath() {
  const base = isDev ? join(__dirname, '../assets') : join(process.resourcesPath, 'assets')
  if (process.platform === 'win32')    return join(base, 'icon.ico')
  if (process.platform === 'darwin')   return join(base, 'icon.icns')
  return join(base, 'icon.png')
}

function saveBounds() {
  if (mainWindow) store.set('windowBounds', mainWindow.getBounds())
}

function setupMenu() {
  const send = (ch: string) => () => mainWindow?.webContents.send(ch)
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Document',   accelerator: 'CmdOrCtrl+N',       click: send('menu-new') },
        { label: 'Open...',        accelerator: 'CmdOrCtrl+O',       click: send('menu-open') },
        { type: 'separator' },
        { label: 'Save',           accelerator: 'CmdOrCtrl+S',       click: send('menu-save') },
        { label: 'Save As...',     accelerator: 'CmdOrCtrl+Shift+S', click: send('menu-save-as') },
        { type: 'separator' },
        { label: 'Export as PDF',  click: send('menu-export-pdf') },
        { label: 'Export as HTML', click: send('menu-export-html') },
        { type: 'separator' },
        { label: 'Print...',       accelerator: 'CmdOrCtrl+P',       click: send('menu-print') },
        { type: 'separator' },
        { label: 'Quit',           accelerator: 'CmdOrCtrl+Q',       click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find & Replace',  accelerator: 'CmdOrCtrl+H',       click: send('menu-find-replace') },
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K',       click: send('menu-command-palette') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B',       click: send('menu-toggle-sidebar') },
        { label: 'Focus Mode',     accelerator: 'F11',                click: send('menu-focus-mode') },
        { type: 'separator' },
        { label: 'Zoom In',        accelerator: 'CmdOrCtrl+=',       click: send('menu-zoom-in') },
        { label: 'Zoom Out',       accelerator: 'CmdOrCtrl+-',       click: send('menu-zoom-out') },
        { label: 'Reset Zoom',     accelerator: 'CmdOrCtrl+0',       click: send('menu-zoom-reset') },
        { type: 'separator' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About KOPPAWORD 2026', click: () => {
          dialog.showMessageBox(mainWindow!, {
            type: 'info', title: 'KOPPAWORD 2026', message: 'KOPPAWORD 2026',
            detail: `Version ${app.getVersion()}\n\nFuturistic Document Editor\nKoppaZZZ © 2026`,
            buttons: ['OK'],
          })
        }},
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Window controls ──────────────────────────────────────────────────────────
ipcMain.handle('window:minimize',    () => mainWindow?.minimize())
ipcMain.handle('window:maximize',    () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
ipcMain.handle('window:close',       () => mainWindow?.close())
ipcMain.handle('window:is-maximized',() => mainWindow?.isMaximized() ?? false)

// ─── File dialogs ─────────────────────────────────────────────────────────────
ipcMain.handle('dialog:open', async (_, filters) =>
  dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters ?? [
      { name: 'KOPPAWORD Documents', extensions: ['kwdoc'] },
      { name: 'Word Documents',      extensions: ['docx'] },
      { name: 'Text / Markdown',     extensions: ['txt', 'md'] },
      { name: 'All Files',           extensions: ['*'] },
    ],
  })
)

ipcMain.handle('dialog:save', async (_, filters, defaultName) =>
  dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName ?? 'Untitled.kwdoc',
    filters: filters ?? [
      { name: 'KOPPAWORD Documents', extensions: ['kwdoc'] },
      { name: 'Text Files',          extensions: ['txt'] },
      { name: 'HTML',                extensions: ['html'] },
    ],
  })
)

// ─── File system ──────────────────────────────────────────────────────────────
ipcMain.handle('file:read', (_, filePath: string) => {
  try {
    return { success: true, data: readFileSync(filePath, 'utf-8') }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

ipcMain.handle('file:write', (_, filePath: string, content: string) => {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// ─── Persistent store ─────────────────────────────────────────────────────────
ipcMain.handle('store:get',    (_, key: string)               => store.get(key))
ipcMain.handle('store:set',    (_, key: string, val: unknown) => store.set(key, val))
ipcMain.handle('store:delete', (_, key: string)               => store.delete(key))

// ─── App info ─────────────────────────────────────────────────────────────────
ipcMain.handle('app:version',  () => app.getVersion())
ipcMain.handle('app:userData', () => app.getPath('userData'))
ipcMain.handle('app:documents',() => app.getPath('documents'))
ipcMain.handle('app:print',    () => mainWindow?.webContents.print())
ipcMain.handle('shell:open',   (_, url: string) => shell.openExternal(url))

// ─── Second instance: open .kwdoc file ────────────────────────────────────────
app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    const fp = argv.find(a => a.endsWith('.kwdoc'))
    if (fp) mainWindow.webContents.send('open-file-path', fp)
  }
})

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  const filePath = process.platform === 'win32'
    ? process.argv.find(a => a.endsWith('.kwdoc'))
    : undefined
  createWindow(filePath)
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  mainWindow ? mainWindow.webContents.send('open-file-path', filePath) : createWindow(filePath)
})
