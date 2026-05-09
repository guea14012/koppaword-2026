import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED = [
  'menu-new', 'menu-open', 'menu-save', 'menu-save-as',
  'menu-export-pdf', 'menu-export-html', 'menu-print',
  'menu-find-replace', 'menu-command-palette',
  'menu-toggle-sidebar', 'menu-focus-mode',
  'menu-zoom-in', 'menu-zoom-out', 'menu-zoom-reset',
  'auto-save-trigger', 'open-file-path',
]

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },
  dialog: {
    open: (filters?: unknown) => ipcRenderer.invoke('dialog:open', filters),
    save: (filters?: unknown, name?: string) => ipcRenderer.invoke('dialog:save', filters, name),
  },
  file: {
    read:  (path: string)               => ipcRenderer.invoke('file:read', path),
    write: (path: string, data: string) => ipcRenderer.invoke('file:write', path, data),
  },
  store: {
    get:    (key: string)               => ipcRenderer.invoke('store:get', key),
    set:    (key: string, val: unknown) => ipcRenderer.invoke('store:set', key, val),
    delete: (key: string)               => ipcRenderer.invoke('store:delete', key),
  },
  app: {
    version:   () => ipcRenderer.invoke('app:version'),
    userData:  () => ipcRenderer.invoke('app:userData'),
    documents: () => ipcRenderer.invoke('app:documents'),
    print:     () => ipcRenderer.invoke('app:print'),
  },
  shell: {
    open: (url: string) => ipcRenderer.invoke('shell:open', url),
  },
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    if (!ALLOWED.includes(channel)) return () => {}
    const handler = (_: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
})
