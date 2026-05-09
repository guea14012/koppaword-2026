import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'

import SplashScreen from './components/SplashScreen/SplashScreen'
import TitleBar from './components/TitleBar/TitleBar'
import TabBar from './components/Tabs/TabBar'
import Toolbar from './components/Toolbar/Toolbar'
import Sidebar from './components/Sidebar/Sidebar'
import KoppaEditor from './components/Editor/KoppaEditor'
import StatusBar from './components/StatusBar/StatusBar'
import CommandPalette from './components/CommandPalette/CommandPalette'
import FindReplace from './components/FindReplace/FindReplace'

import { useEditorStore } from './stores/editorStore'
import { useDocumentStore } from './stores/documentStore'
import clsx from 'clsx'

declare global {
  interface Window {
    electronAPI?: {
      window: { minimize: () => void; maximize: () => void; close: () => void; isMaximized: () => Promise<boolean> }
      dialog: {
        open: (f?: unknown[]) => Promise<{ canceled: boolean; filePaths: string[] }>
        save: (f?: unknown[], n?: string) => Promise<{ canceled: boolean; filePath?: string }>
      }
      file: {
        read: (p: string) => Promise<{ success: boolean; data?: string; error?: string }>
        write: (p: string, c: string) => Promise<{ success: boolean; error?: string }>
      }
      store: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown) => void }
      app: { version: () => Promise<string>; path: () => Promise<string> }
      on: (ch: string, cb: (...a: unknown[]) => void) => () => void
    }
  }
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const { showSidebar, focusMode } = useEditorStore()
  const { newDocument, openDocument, getActiveDocument, updateDocument } = useDocumentStore()

  const handleBooted = useCallback(() => {
    setBooted(true)
    newDocument()
  }, [newDocument])

  useEffect(() => {
    if (!window.electronAPI) return
    const api = window.electronAPI
    const unsubs = [
      api.on('menu-new',            () => newDocument()),
      api.on('menu-open',           handleOpenFile),
      api.on('menu-save',           handleSave),
      api.on('menu-save-as',        handleSaveAs),
      api.on('menu-export-pdf',     handleExportPDF),
      api.on('menu-export-html',    handleExportHTML),
      api.on('menu-toggle-sidebar', () => useEditorStore.getState().toggleSidebar()),
      api.on('menu-focus-mode',     () => useEditorStore.getState().toggleFocusMode()),
      api.on('menu-command-palette',() => useEditorStore.getState().toggleCommandPalette()),
      api.on('menu-find-replace',   () => useEditorStore.getState().toggleFindReplace()),
      api.on('menu-zoom-in',   () => { const s = useEditorStore.getState(); s.setZoom(Math.min(200, s.zoom + 10)) }),
      api.on('menu-zoom-out',  () => { const s = useEditorStore.getState(); s.setZoom(Math.max(50,  s.zoom - 10)) }),
      api.on('menu-zoom-reset',() => useEditorStore.getState().setZoom(100)),
      api.on('auto-save-trigger', handleAutoSave),
    ]
    return () => unsubs.forEach(u => u())
  }, []) // eslint-disable-line

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'n') { e.preventDefault(); newDocument() }
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleOpenFile = async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.dialog.open()
    if (result.canceled || !result.filePaths[0]) return
    const path = result.filePaths[0]
    const readResult = await window.electronAPI.file.read(path)
    if (!readResult.success) { toast.error('Failed to read file'); return }
    const title = path.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? 'Document'
    let content = readResult.data ?? ''
    if (path.endsWith('.kwdoc')) {
      try { const parsed = JSON.parse(content); content = parsed.content ?? content } catch {}
    } else {
      content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`
    }
    openDocument(path, title, content)
    toast.success(`Opened: ${title}`)
  }

  const handleSave = async () => {
    const doc = getActiveDocument()
    if (!doc || !window.electronAPI) return
    let fp = doc.filePath
    if (!fp) {
      const result = await window.electronAPI.dialog.save(undefined, `${doc.title}.kwdoc`)
      if (result.canceled || !result.filePath) return
      fp = result.filePath
    }
    const payload = JSON.stringify({ title: doc.title, content: doc.content, version: '1.0', savedAt: Date.now() }, null, 2)
    const res = await window.electronAPI.file.write(fp, payload)
    if (res.success) {
      updateDocument(doc.id, { filePath: fp, isDirty: false })
      toast.success('Saved')
    } else {
      toast.error('Save failed: ' + res.error)
    }
  }

  const handleSaveAs = async () => {
    const doc = getActiveDocument()
    if (!doc || !window.electronAPI) return
    const result = await window.electronAPI.dialog.save(undefined, `${doc.title}.kwdoc`)
    if (result.canceled || !result.filePath) return
    const payload = JSON.stringify({ title: doc.title, content: doc.content, version: '1.0', savedAt: Date.now() }, null, 2)
    const res = await window.electronAPI.file.write(result.filePath, payload)
    if (res.success) {
      updateDocument(doc.id, { filePath: result.filePath, isDirty: false })
      toast.success('Saved as: ' + result.filePath.split(/[\\/]/).pop())
    }
  }

  const handleAutoSave = () => {
    const doc = getActiveDocument()
    if (doc?.isDirty && doc.filePath && window.electronAPI) handleSave()
  }

  const handleExportPDF = () => {
    toast('Use the print dialog (Ctrl+P) to export as PDF', { icon: '📄' })
    window.print()
  }

  const handleExportHTML = async () => {
    const doc = getActiveDocument()
    if (!doc) return
    const html = `<!DOCTYPE html><html><head><title>${doc.title}</title></head><body>${doc.content}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${doc.title}.html`
    a.click()
    toast.success('Exported as HTML')
  }

  return (
    <>
      <AnimatePresence>{!booted && <SplashScreen onComplete={handleBooted} />}</AnimatePresence>

      {booted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={clsx('flex flex-col h-screen w-screen overflow-hidden', focusMode && 'focus-mode')}
          style={{ background: 'var(--koppa-bg)' }}
        >
          <TitleBar />
          <TabBar />
          {!focusMode && <Toolbar />}

          <div className="flex flex-1 overflow-hidden relative">
            <AnimatePresence>
              {showSidebar && !focusMode && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 230, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden shrink-0 h-full"
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-hidden relative">
              <KoppaEditor />
              <FindReplace />
            </div>
          </div>

          {!focusMode && <StatusBar />}
          <CommandPalette />
        </motion.div>
      )}
    </>
  )
}
