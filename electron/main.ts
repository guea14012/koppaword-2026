import {
  app, BrowserWindow, ipcMain, dialog, Menu, shell,
  nativeTheme, protocol, Notification,
} from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import Store from 'electron-store'
import Database from 'better-sqlite3'
import Anthropic from '@anthropic-ai/sdk'

import { v4 as uuidv4 } from 'uuid'
import os from 'os'

// ─── App Setup ────────────────────────────────────────────────────────────────
const store = new Store()
const isDev = !app.isPackaged

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// ─── SQLite Setup (runs in main process — no separate server needed) ──────────
const DB_DIR = join(app.getPath('userData'), 'data')
if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true })
const DB_PATH = join(DB_DIR, 'documents.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    content     TEXT NOT NULL DEFAULT '',
    file_path   TEXT,
    word_count  INTEGER DEFAULT 0,
    char_count  INTEGER DEFAULT 0,
    encrypted   INTEGER DEFAULT 0,
    language    TEXT DEFAULT 'en',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS document_versions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    word_count  INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT DEFAULT 'General',
    content     TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_docs_updated ON documents(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_versions_doc ON document_versions(document_id, created_at DESC);
`)

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null

function createWindow(filePath?: string) {
  const bounds = store.get('windowBounds', { width: 1400, height: 900 }) as {
    width: number; height: number; x?: number; y?: number
  }

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 920,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#080810',
    show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
    if (filePath) {
      mainWindow?.webContents.send('open-file-path', filePath)
    }
  })

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)
  mainWindow.on('closed', () => { mainWindow = null })

  setupMenu()
  setupAutoSave()
}

function getIconPath() {
  const base = isDev ? join(__dirname, '../assets') : join(process.resourcesPath, 'assets')
  if (process.platform === 'win32') return join(base, 'icon.ico')
  if (process.platform === 'darwin') return join(base, 'icon.icns')
  return join(base, 'icon.png')
}

function saveBounds() {
  if (mainWindow) store.set('windowBounds', mainWindow.getBounds())
}

// ─── Auto-save every 30 s ─────────────────────────────────────────────────────
function setupAutoSave() {
  setInterval(() => mainWindow?.webContents.send('auto-save-trigger'), 30_000)
}

// ─── Native Menu ──────────────────────────────────────────────────────────────
function setupMenu() {
  const send = (ch: string) => () => mainWindow?.webContents.send(ch)

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Document',      accelerator: 'CmdOrCtrl+N',       click: send('menu-new') },
        { label: 'Open...',           accelerator: 'CmdOrCtrl+O',       click: send('menu-open') },
        { type: 'separator' },
        { label: 'Save',              accelerator: 'CmdOrCtrl+S',       click: send('menu-save') },
        { label: 'Save As...',        accelerator: 'CmdOrCtrl+Shift+S', click: send('menu-save-as') },
        { type: 'separator' },
        { label: 'Export as PDF',     click: send('menu-export-pdf') },
        { label: 'Export as HTML',    click: send('menu-export-html') },
        { type: 'separator' },
        { label: 'Print...',          accelerator: 'CmdOrCtrl+P',       click: send('menu-print') },
        { type: 'separator' },
        { label: 'Quit KOPPAWORD',    accelerator: 'CmdOrCtrl+Q',       click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' }, { type: 'separator' },
        { label: 'Find & Replace',    accelerator: 'CmdOrCtrl+H',       click: send('menu-find-replace') },
        { label: 'Command Palette',   accelerator: 'CmdOrCtrl+K',       click: send('menu-command-palette') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar',    accelerator: 'CmdOrCtrl+B',       click: send('menu-toggle-sidebar') },
        { label: 'Toggle AI Panel',   accelerator: 'CmdOrCtrl+Shift+A', click: send('menu-toggle-ai') },
        { label: 'Focus Mode',        accelerator: 'F11',                click: send('menu-focus-mode') },
        { type: 'separator' },
        { label: 'Zoom In',           accelerator: 'CmdOrCtrl+=',       click: send('menu-zoom-in') },
        { label: 'Zoom Out',          accelerator: 'CmdOrCtrl+-',       click: send('menu-zoom-out') },
        { label: 'Reset Zoom',        accelerator: 'CmdOrCtrl+0',       click: send('menu-zoom-reset') },
        { type: 'separator' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About KOPPAWORD 2026',
          click: () => dialog.showMessageBox(mainWindow!, {
            type: 'info',
            title: 'KOPPAWORD 2026',
            message: 'KOPPAWORD 2026',
            detail: `Version ${app.getVersion()}\n\nFuturistic Cross-Platform Document Editor\nBuilt by KoppaZZZ\n© 2026 All rights reserved`,
            buttons: ['OK'],
            icon: getIconPath(),
          }),
        },
        { label: 'Keyboard Shortcuts', accelerator: 'CmdOrCtrl+/', click: send('menu-shortcuts') },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Second-instance (open file by clicking .kwdoc) ──────────────────────────
app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    const filePath = argv.find(a => a.endsWith('.kwdoc'))
    if (filePath) mainWindow.webContents.send('open-file-path', filePath)
  }
})

// ─── IPC: Window controls ─────────────────────────────────────────────────────
ipcMain.handle('window:minimize',    () => mainWindow?.minimize())
ipcMain.handle('window:maximize',    () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize())
ipcMain.handle('window:close',       () => mainWindow?.close())
ipcMain.handle('window:is-maximized',() => mainWindow?.isMaximized() ?? false)

// ─── IPC: Dialogs ─────────────────────────────────────────────────────────────
ipcMain.handle('dialog:open', async (_, filters) => {
  return dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters ?? [
      { name: 'KOPPAWORD Documents', extensions: ['kwdoc'] },
      { name: 'Word Documents',      extensions: ['docx'] },
      { name: 'Text / Markdown',     extensions: ['txt', 'md'] },
      { name: 'All Files',           extensions: ['*'] },
    ],
  })
})

ipcMain.handle('dialog:save', async (_, filters, defaultName) => {
  return dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName ?? 'Untitled.kwdoc',
    filters: filters ?? [
      { name: 'KOPPAWORD Documents', extensions: ['kwdoc'] },
      { name: 'Text Files',          extensions: ['txt'] },
      { name: 'HTML',                extensions: ['html'] },
    ],
  })
})

// ─── IPC: File system ─────────────────────────────────────────────────────────
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

ipcMain.handle('file:write-binary', (_, filePath: string, data: number[]) => {
  try {
    writeFileSync(filePath, Buffer.from(data))
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// ─── IPC: Persistent store ────────────────────────────────────────────────────
ipcMain.handle('store:get',    (_, key: string) => store.get(key))
ipcMain.handle('store:set',    (_, key: string, value: unknown) => store.set(key, value))
ipcMain.handle('store:delete', (_, key: string) => store.delete(key))

// ─── IPC: App info ────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:userData', () => app.getPath('userData'))
ipcMain.handle('app:documents', () => app.getPath('documents'))
ipcMain.handle('shell:open', (_, url: string) => shell.openExternal(url))
ipcMain.handle('app:print', () => mainWindow?.webContents.print())

// ─── IPC: SQLite documents ───────────────────────────────────────────────────
ipcMain.handle('db:documents:list', () => {
  return db.prepare(
    'SELECT id, title, file_path, word_count, char_count, language, created_at, updated_at FROM documents ORDER BY updated_at DESC LIMIT 100'
  ).all()
})

ipcMain.handle('db:documents:get', (_, id: string) =>
  db.prepare('SELECT * FROM documents WHERE id = ?').get(id) ?? null
)

ipcMain.handle('db:documents:create', (_, { title = 'Untitled', content = '', file_path = null, language = 'en' }) => {
  const id = uuidv4()
  const now = Date.now()
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
  const charCount = content.replace(/<[^>]*>/g, '').length
  db.prepare(
    'INSERT INTO documents (id, title, content, file_path, word_count, char_count, language, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(id, title, content, file_path, wordCount, charCount, language, now, now)
  return { id, created_at: now }
})

ipcMain.handle('db:documents:update', (_, id: string, updates: Record<string, unknown>) => {
  const now = Date.now()
  const content = (updates.content as string) ?? ''
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
  const charCount = content.replace(/<[^>]*>/g, '').length

  if (content) {
    db.prepare('INSERT INTO document_versions (document_id, content, word_count, created_at) VALUES (?,?,?,?)').run(id, content, wordCount, now)
    db.prepare(`DELETE FROM document_versions WHERE document_id=? AND id NOT IN (SELECT id FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 50)`).run(id, id)
  }

  db.prepare(
    'UPDATE documents SET title=COALESCE(?,title), content=COALESCE(?,content), file_path=COALESCE(?,file_path), word_count=?, char_count=?, language=COALESCE(?,language), updated_at=? WHERE id=?'
  ).run(updates.title ?? null, content || null, updates.file_path ?? null, wordCount, charCount, updates.language ?? null, now, id)
  return { updated_at: now }
})

ipcMain.handle('db:documents:delete', (_, id: string) => {
  db.prepare('DELETE FROM documents WHERE id = ?').run(id)
  return true
})

ipcMain.handle('db:documents:versions', (_, id: string) =>
  db.prepare('SELECT id, word_count, created_at FROM document_versions WHERE document_id=? ORDER BY created_at DESC LIMIT 20').all(id)
)

// ─── IPC: AI (Anthropic SDK in main process) ──────────────────────────────────
const AI_SYSTEM = `You are an intelligent writing assistant in KOPPAWORD 2026, a professional document editor. Help users rewrite, summarize, translate, fix grammar, expand ideas, and answer questions about their documents. Keep responses focused and clean.`

ipcMain.handle('ai:chat', async (_, { message, context, history = [], apiKey }) => {
  const key = apiKey || store.get('ai-api-key') as string || process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('No API key. Set it in the AI panel settings.')

  const client = new Anthropic({ apiKey: key })
  const messages: Anthropic.MessageParam[] = []

  if (context?.trim()) {
    messages.push({ role: 'user', content: `[Document context]:\n${context}` })
    messages.push({ role: 'assistant', content: 'Got the document context. How can I help?' })
  }

  for (const m of (history as Array<{ role: string; content: string }>).slice(-6)) {
    messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
  }
  messages.push({ role: 'user', content: message })

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: AI_SYSTEM,
    messages,
  })
  return { response: res.content[0].type === 'text' ? res.content[0].text : '' }
})

ipcMain.handle('ai:store-key', (_, key: string) => store.set('ai-api-key', key))
ipcMain.handle('ai:get-key',   ()              => !!(store.get('ai-api-key') as string))

// ─── Menu event forwarders ────────────────────────────────────────────────────
// (already sent above via send() closures)

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Register .kwdoc file association handler on Windows
  if (process.platform === 'win32') {
    const argv = process.argv
    const filePath = argv.find(a => a.endsWith('.kwdoc'))
    createWindow(filePath)
  } else {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// macOS: open file by double-clicking .kwdoc
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) mainWindow.webContents.send('open-file-path', filePath)
  else createWindow(filePath)
})
