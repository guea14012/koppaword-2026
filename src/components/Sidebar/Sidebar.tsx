import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, Folder, Search, Hash,
  ChevronRight, ChevronDown, Plus, Star,
} from 'lucide-react'
import { useDocumentStore } from '../../stores/documentStore'
import { useEditorStore } from '../../stores/editorStore'
import clsx from 'clsx'

type Panel = 'files' | 'outline' | 'recent' | 'search'

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState<Panel>('files')
  const [searchQuery, setSearchQuery] = useState('')
  const { recentFiles, newDocument, openDocument } = useDocumentStore()
  const { editor } = useEditorStore()

  const outline = getOutline(editor)

  const panels: { id: Panel; icon: React.ElementType; label: string }[] = [
    { id: 'files',   icon: Folder,   label: 'Explorer' },
    { id: 'outline', icon: Hash,     label: 'Outline' },
    { id: 'recent',  icon: Clock,    label: 'Recent' },
    { id: 'search',  icon: Search,   label: 'Search' },
  ]

  return (
    <div
      className="flex h-full border-r border-koppa-border"
      style={{ background: 'rgba(8,8,16,0.95)' }}
    >
      {/* Icon rail */}
      <div className="flex flex-col items-center w-10 pt-2 border-r border-koppa-border gap-1">
        {panels.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            title={p.label}
            className={clsx(
              'w-8 h-8 rounded flex items-center justify-center transition-colors',
              activePanel === p.id
                ? 'text-koppa-neon bg-koppa-hover'
                : 'text-koppa-dim hover:text-koppa-muted hover:bg-koppa-hover',
            )}
          >
            <p.icon size={14} />
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => newDocument()}
          className="w-8 h-8 rounded flex items-center justify-center text-koppa-dim hover:text-koppa-neon hover:bg-koppa-hover transition-colors mb-2"
          title="New Document"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 w-48 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-koppa-border">
          <span className="text-koppa-muted text-xs font-medium tracking-widest uppercase">
            {panels.find(p => p.id === activePanel)?.label}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12 }}
            className="flex-1 overflow-y-auto p-2"
          >
            {activePanel === 'files' && <FilesPanel />}
            {activePanel === 'outline' && <OutlinePanel items={outline} />}
            {activePanel === 'recent' && <RecentPanel files={recentFiles} />}
            {activePanel === 'search' && (
              <SearchPanel
                query={searchQuery}
                onChange={setSearchQuery}
                editor={editor}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function FilesPanel() {
  const { tabs, activeTabId, setActiveTab, newDocument } = useDocumentStore()
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-koppa-dim text-xs">Open Documents</span>
        <button onClick={() => newDocument()} className="text-koppa-dim hover:text-koppa-neon transition-colors">
          <Plus size={11} />
        </button>
      </div>
      {tabs.length === 0 && (
        <p className="text-koppa-dim text-xs px-1 italic">No open documents</p>
      )}
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={clsx('sidebar-item w-full text-left', tab.id === activeTabId && 'active')}
        >
          <FileText size={12} className="shrink-0" />
          <span className="truncate text-xs">{tab.isDirty ? '● ' : ''}{tab.title}</span>
        </button>
      ))}
    </div>
  )
}

interface OutlineItem {
  level: number
  text: string
  pos: number
}

function OutlinePanel({ items }: { items: OutlineItem[] }) {
  const { editor } = useEditorStore()

  if (items.length === 0) {
    return <p className="text-koppa-dim text-xs px-1 italic">No headings found</p>
  }

  return (
    <div className="space-y-0.5">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => editor?.commands.focus()}
          className="flex items-center gap-1 w-full text-left px-1 py-1 rounded hover:bg-koppa-hover transition-colors group"
          style={{ paddingLeft: `${(item.level - 1) * 10 + 4}px` }}
        >
          <Hash size={10} className="text-koppa-neon opacity-60 shrink-0" />
          <span className="text-xs text-koppa-muted group-hover:text-koppa-text truncate">{item.text}</span>
        </button>
      ))}
    </div>
  )
}

function RecentPanel({ files }: { files: ReturnType<typeof useDocumentStore>['recentFiles'] }) {
  if (files.length === 0) {
    return <p className="text-koppa-dim text-xs px-1 italic">No recent files</p>
  }
  return (
    <div className="space-y-0.5">
      {files.map((f, i) => (
        <div key={i} className="sidebar-item">
          <FileText size={12} className="shrink-0 text-koppa-neon opacity-60" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-koppa-muted truncate">{f.title}</div>
            <div className="text-xs text-koppa-dim truncate opacity-70">
              {new Date(f.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchPanel({ query, onChange, editor }: {
  query: string; onChange: (q: string) => void; editor: ReturnType<typeof useEditorStore>['editor']
}) {
  const results: string[] = []
  if (query && editor) {
    const text = editor.getText()
    const regex = new RegExp(query, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 30)
      const end = Math.min(text.length, match.index + query.length + 30)
      results.push('...' + text.slice(start, end) + '...')
      if (results.length >= 20) break
    }
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Search in document..."
        className="w-full bg-koppa-card border border-koppa-border rounded px-2 py-1.5 text-xs text-koppa-text placeholder-koppa-dim outline-none focus:border-koppa-neon transition-colors"
        autoFocus
      />
      {query && (
        <div className="mt-2">
          <div className="text-koppa-dim text-xs mb-1">{results.length} results</div>
          {results.map((r, i) => (
            <div key={i} className="text-xs text-koppa-muted px-1 py-1 rounded hover:bg-koppa-hover cursor-pointer truncate">
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getOutline(editor: ReturnType<typeof useEditorStore>['editor']): OutlineItem[] {
  if (!editor) return []
  const items: OutlineItem[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      items.push({ level: node.attrs.level, text: node.textContent, pos })
    }
  })
  return items
}
