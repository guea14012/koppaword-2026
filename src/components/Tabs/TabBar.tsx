import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, FileText } from 'lucide-react'
import { useDocumentStore } from '../../stores/documentStore'
import { useEditorStore } from '../../stores/editorStore'
import clsx from 'clsx'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeDocument, newDocument } = useDocumentStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleNew = () => newDocument()

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeDocument(tabId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div
      className="flex items-center h-10 border-b border-koppa-border"
      style={{ background: 'rgba(8,8,16,0.9)' }}
    >
      {/* Tabs */}
      <div
        ref={scrollRef}
        className="flex items-end flex-1 overflow-x-auto overflow-y-hidden h-full"
        style={{ scrollbarWidth: 'none' }}
        onWheel={handleWheel}
      >
        <AnimatePresence initial={false}>
          {tabs.map(tab => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'group relative flex items-center gap-2 h-full px-4 min-w-[120px] max-w-[200px] cursor-pointer',
                'border-r border-koppa-border select-none shrink-0 text-sm transition-colors',
                tab.id === activeTabId
                  ? 'bg-koppa-panel text-koppa-text'
                  : 'text-koppa-muted hover:text-koppa-text hover:bg-koppa-surface',
              )}
            >
              {/* Active indicator */}
              {tab.id === activeTabId && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }}
                />
              )}

              <FileText size={12} className="shrink-0 opacity-60" />
              <span className="truncate flex-1 text-xs">
                {tab.isDirty ? '● ' : ''}{tab.title}
              </span>

              <button
                onClick={e => handleClose(e, tab.id)}
                className={clsx(
                  'shrink-0 w-4 h-4 rounded flex items-center justify-center opacity-0 transition-opacity',
                  'hover:bg-koppa-hover hover:text-koppa-danger',
                  'group-hover:opacity-100',
                  tab.isDirty && 'opacity-60',
                )}
              >
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* New tab button */}
      <button
        onClick={handleNew}
        className="flex items-center justify-center w-10 h-10 text-koppa-dim hover:text-koppa-neon hover:bg-koppa-hover transition-colors shrink-0 border-l border-koppa-border"
        title="New Document (Ctrl+N)"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
