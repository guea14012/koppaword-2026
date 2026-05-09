import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { KoppaDocument, EditorTab, RecentFile } from '../types'

interface DocumentStore {
  documents: Map<string, KoppaDocument>
  tabs: EditorTab[]
  activeTabId: string | null
  recentFiles: RecentFile[]

  // Document ops
  newDocument: () => string
  openDocument: (filePath: string, title: string, content: string) => string
  updateDocument: (id: string, updates: Partial<KoppaDocument>) => void
  closeDocument: (id: string) => void
  getActiveDocument: () => KoppaDocument | null
  setActiveTab: (tabId: string) => void

  // Recent files
  addRecentFile: (file: RecentFile) => void
  clearRecentFiles: () => void
}

const DEFAULT_CONTENT = '<p>Start writing your document...</p>'

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: new Map(),
  tabs: [],
  activeTabId: null,
  recentFiles: [],

  newDocument: () => {
    const id = uuidv4()
    const doc: KoppaDocument = {
      id,
      title: 'Untitled Document',
      content: DEFAULT_CONTENT,
      filePath: null,
      isDirty: false,
      isNew: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0,
      charCount: 0,
      language: 'en',
      encrypted: false,
    }
    const tab: EditorTab = {
      id: uuidv4(),
      documentId: id,
      title: 'Untitled Document',
      isActive: true,
      isDirty: false,
    }
    set(state => {
      const docs = new Map(state.documents)
      docs.set(id, doc)
      const tabs = state.tabs.map(t => ({ ...t, isActive: false }))
      return { documents: docs, tabs: [...tabs, tab], activeTabId: tab.id }
    })
    return id
  },

  openDocument: (filePath, title, content) => {
    // Check if already open
    const state = get()
    for (const [id, doc] of state.documents) {
      if (doc.filePath === filePath) {
        const tab = state.tabs.find(t => t.documentId === id)
        if (tab) {
          set(s => ({
            tabs: s.tabs.map(t => ({ ...t, isActive: t.id === tab.id })),
            activeTabId: tab.id,
          }))
          return id
        }
      }
    }

    const id = uuidv4()
    const doc: KoppaDocument = {
      id,
      title,
      content,
      filePath,
      isDirty: false,
      isNew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0,
      charCount: 0,
      language: 'en',
      encrypted: false,
    }
    const tab: EditorTab = {
      id: uuidv4(),
      documentId: id,
      title,
      isActive: true,
      isDirty: false,
    }
    set(state => {
      const docs = new Map(state.documents)
      docs.set(id, doc)
      const tabs = state.tabs.map(t => ({ ...t, isActive: false }))
      return { documents: docs, tabs: [...tabs, tab], activeTabId: tab.id }
    })
    return id
  },

  updateDocument: (id, updates) => {
    set(state => {
      const docs = new Map(state.documents)
      const doc = docs.get(id)
      if (!doc) return state
      docs.set(id, { ...doc, ...updates, updatedAt: Date.now() })
      const tabs = state.tabs.map(t =>
        t.documentId === id
          ? { ...t, title: updates.title ?? t.title, isDirty: updates.isDirty ?? t.isDirty }
          : t,
      )
      return { documents: docs, tabs }
    })
  },

  closeDocument: (tabId) => {
    set(state => {
      const tab = state.tabs.find(t => t.id === tabId)
      if (!tab) return state
      const newTabs = state.tabs.filter(t => t.id !== tabId)
      const docs = new Map(state.documents)
      const hasOtherTab = newTabs.some(t => t.documentId === tab.documentId)
      if (!hasOtherTab) docs.delete(tab.documentId)
      let newActiveTabId = state.activeTabId
      if (state.activeTabId === tabId) {
        const idx = state.tabs.findIndex(t => t.id === tabId)
        const next = newTabs[Math.min(idx, newTabs.length - 1)]
        newActiveTabId = next?.id ?? null
        if (next) {
          newTabs.forEach(t => { t.isActive = t.id === next.id })
        }
      }
      return { documents: docs, tabs: newTabs, activeTabId: newActiveTabId }
    })
  },

  getActiveDocument: () => {
    const { tabs, activeTabId, documents } = get()
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return null
    return documents.get(tab.documentId) ?? null
  },

  setActiveTab: (tabId) => {
    set(state => ({
      activeTabId: tabId,
      tabs: state.tabs.map(t => ({ ...t, isActive: t.id === tabId })),
    }))
  },

  addRecentFile: (file) => {
    set(state => {
      const filtered = state.recentFiles.filter(f => f.path !== file.path)
      return { recentFiles: [file, ...filtered].slice(0, 20) }
    })
  },

  clearRecentFiles: () => set({ recentFiles: [] }),
}))
