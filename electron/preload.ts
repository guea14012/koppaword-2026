import { contextBridge, ipcRenderer } from 'electron'

const MENU_CHANNELS = [
  'menu-new', 'menu-open', 'menu-save', 'menu-save-as',
  'menu-export-pdf', 'menu-export-html', 'menu-print',
  'menu-find-replace', 'menu-command-palette',
  'menu-toggle-sidebar', 'menu-toggle-ai', 'menu-focus-mode',
  'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset',
  'menu-shortcuts', 'auto-save-trigger', 'open-file-path',
]

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window ──────────────────────────────────────────────
  window: {
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },

  // ── File dialogs ─────────────────────────────────────────
  dialog: {
    open: (filters?: unknown) => ipcRenderer.invoke('dialog:open', filters),
    save: (filters?: unknown, name?: string) => ipcRenderer.invoke('dialog:save', filters, name),
  },

  // ── File system ──────────────────────────────────────────
  file: {
    read:        (path: string)               => ipcRenderer.invoke('file:read', path),
    write:       (path: string, data: string) => ipcRenderer.invoke('file:write', path, data),
    writeBinary: (path: string, buf: number[])=> ipcRenderer.invoke('file:write-binary', path, buf),
  },

  // ── Persistent key-value store ───────────────────────────
  store: {
    get:    (key: string)               => ipcRenderer.invoke('store:get', key),
    set:    (key: string, val: unknown) => ipcRenderer.invoke('store:set', key, val),
    delete: (key: string)               => ipcRenderer.invoke('store:delete', key),
  },

  // ── App info ─────────────────────────────────────────────
  app: {
    version:   () => ipcRenderer.invoke('app:version'),
    userData:  () => ipcRenderer.invoke('app:userData'),
    documents: () => ipcRenderer.invoke('app:documents'),
    print:     () => ipcRenderer.invoke('app:print'),
  },

  shell: {
    open: (url: string) => ipcRenderer.invoke('shell:open', url),
  },

  // ── SQLite documents (no HTTP server needed) ─────────────
  db: {
    list:     ()                          => ipcRenderer.invoke('db:documents:list'),
    get:      (id: string)                => ipcRenderer.invoke('db:documents:get', id),
    create:   (data: unknown)             => ipcRenderer.invoke('db:documents:create', data),
    update:   (id: string, data: unknown) => ipcRenderer.invoke('db:documents:update', id, data),
    delete:   (id: string)                => ipcRenderer.invoke('db:documents:delete', id),
    versions: (id: string)                => ipcRenderer.invoke('db:documents:versions', id),
  },

  // ── AI (Anthropic SDK in main process) ───────────────────
  ai: {
    chat:     (params: unknown) => ipcRenderer.invoke('ai:chat', params),
    storeKey: (key: string)     => ipcRenderer.invoke('ai:store-key', key),
    hasKey:   ()                => ipcRenderer.invoke('ai:get-key'),
  },

  // ── Menu / event bus ─────────────────────────────────────
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    if (!MENU_CHANNELS.includes(channel)) return () => {}
    const handler = (_: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
})
