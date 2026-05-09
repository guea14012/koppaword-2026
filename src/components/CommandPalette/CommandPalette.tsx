import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FileText, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Table, Image, Link2,
  Code2, Quote, Save, FolderOpen, Bot, Maximize2, ZoomIn,
  ZoomOut, Minus, CheckSquare, Hash,
} from 'lucide-react'
import Fuse from 'fuse.js'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'
import { Command } from '../../types'
import clsx from 'clsx'

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const {
    showCommandPalette, toggleCommandPalette,
    editor, toggleAIPanel, toggleFindReplace,
    toggleFocusMode, setZoom, zoom,
  } = useEditorStore()
  const { newDocument } = useDocumentStore()

  const commands: Command[] = useMemo(() => [
    // Document
    { id: 'new',         label: 'New Document',       shortcut: 'Ctrl+N',  category: 'Document', icon: 'FileText',   action: () => newDocument() },
    { id: 'find',        label: 'Find & Replace',     shortcut: 'Ctrl+H',  category: 'Document', icon: 'Search',     action: () => toggleFindReplace() },
    { id: 'ai',          label: 'Open AI Assistant',  shortcut: 'Ctrl+⇧A', category: 'AI',       icon: 'Bot',        action: () => toggleAIPanel() },
    { id: 'focus',       label: 'Toggle Focus Mode',  shortcut: 'F11',     category: 'View',     icon: 'Maximize2',  action: () => toggleFocusMode() },
    { id: 'zoom-in',     label: 'Zoom In',            shortcut: 'Ctrl+=',  category: 'View',     icon: 'ZoomIn',     action: () => setZoom(Math.min(200, zoom + 10)) },
    { id: 'zoom-out',    label: 'Zoom Out',           shortcut: 'Ctrl+-',  category: 'View',     icon: 'ZoomOut',    action: () => setZoom(Math.max(50, zoom - 10)) },
    { id: 'zoom-reset',  label: 'Reset Zoom',         shortcut: 'Ctrl+0',  category: 'View',     icon: 'ZoomIn',     action: () => setZoom(100) },

    // Formatting
    { id: 'bold',        label: 'Toggle Bold',        shortcut: 'Ctrl+B',  category: 'Format',   icon: 'Bold',       action: () => editor?.chain().focus().toggleBold().run() },
    { id: 'italic',      label: 'Toggle Italic',      shortcut: 'Ctrl+I',  category: 'Format',   icon: 'Italic',     action: () => editor?.chain().focus().toggleItalic().run() },
    { id: 'underline',   label: 'Toggle Underline',   shortcut: 'Ctrl+U',  category: 'Format',   icon: 'Underline',  action: () => editor?.chain().focus().toggleUnderline().run() },
    { id: 'code',        label: 'Toggle Code',        shortcut: 'Ctrl+E',  category: 'Format',   icon: 'Code2',      action: () => editor?.chain().focus().toggleCode().run() },
    { id: 'blockquote',  label: 'Toggle Blockquote',  shortcut: 'Ctrl+⇧B', category: 'Format',   icon: 'Quote',      action: () => editor?.chain().focus().toggleBlockquote().run() },
    { id: 'h1',          label: 'Heading 1',          shortcut: 'Ctrl+Alt+1', category: 'Format', icon: 'Hash',       action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2',          label: 'Heading 2',          shortcut: 'Ctrl+Alt+2', category: 'Format', icon: 'Hash',       action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'h3',          label: 'Heading 3',          shortcut: 'Ctrl+Alt+3', category: 'Format', icon: 'Hash',       action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { id: 'align-l',     label: 'Align Left',         category: 'Format',   icon: 'AlignLeft',   action: () => editor?.chain().focus().setTextAlign('left').run() },
    { id: 'align-c',     label: 'Align Center',       category: 'Format',   icon: 'AlignCenter', action: () => editor?.chain().focus().setTextAlign('center').run() },
    { id: 'align-r',     label: 'Align Right',        category: 'Format',   icon: 'AlignRight',  action: () => editor?.chain().focus().setTextAlign('right').run() },

    // Insert
    { id: 'bullet',      label: 'Bullet List',        category: 'Insert',   icon: 'List',        action: () => editor?.chain().focus().toggleBulletList().run() },
    { id: 'ordered',     label: 'Numbered List',      category: 'Insert',   icon: 'ListOrdered', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { id: 'task',        label: 'Task List',           category: 'Insert',   icon: 'CheckSquare', action: () => editor?.chain().focus().toggleTaskList().run() },
    { id: 'hr',          label: 'Horizontal Rule',    category: 'Insert',   icon: 'Minus',       action: () => editor?.chain().focus().setHorizontalRule().run() },
    { id: 'table',       label: 'Insert Table',       category: 'Insert',   icon: 'Table',       action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: 'codeblock',   label: 'Code Block',         category: 'Insert',   icon: 'Code2',       action: () => editor?.chain().focus().toggleCodeBlock().run() },
    { id: 'link',        label: 'Insert Link',        shortcut: 'Ctrl+K',  category: 'Insert',   icon: 'Link2',      action: () => {
      const url = prompt('URL:')
      if (url) editor?.chain().focus().setLink({ href: url }).run()
    }},
    { id: 'image',       label: 'Insert Image',       category: 'Insert',   icon: 'Image',       action: () => {
      const url = prompt('Image URL:')
      if (url) editor?.chain().focus().setImage({ src: url }).run()
    }},
    { id: 'clear-fmt',   label: 'Clear Formatting',   category: 'Format',   icon: 'FileText',    action: () => editor?.chain().focus().clearNodes().unsetAllMarks().run() },
  ], [editor, zoom, newDocument, toggleAIPanel, toggleFindReplace, toggleFocusMode, setZoom])

  const fuse = useMemo(() => new Fuse(commands, {
    keys: ['label', 'category', 'shortcut'],
    threshold: 0.3,
  }), [commands])

  const filtered = useMemo(() => {
    if (!query) return commands
    return fuse.search(query).map(r => r.item)
  }, [query, fuse, commands])

  useEffect(() => {
    if (showCommandPalette) {
      inputRef.current?.focus()
      setQuery('')
      setSelected(0)
    }
  }, [showCommandPalette])

  useEffect(() => setSelected(0), [query])

  const execute = (cmd: Command) => {
    toggleCommandPalette()
    setTimeout(() => cmd.action(), 50)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[selected]) execute(filtered[selected]) }
    if (e.key === 'Escape')    { toggleCommandPalette() }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>()
    filtered.forEach(cmd => {
      const g = map.get(cmd.category) ?? []
      g.push(cmd)
      map.set(cmd.category, g)
    })
    return map
  }, [filtered])

  const iconMap: Record<string, React.ElementType> = {
    FileText, Bold, Italic, Underline, Code2, Quote, Save,
    FolderOpen, Bot, Maximize2, ZoomIn, ZoomOut, Search,
    List, ListOrdered, CheckSquare, AlignLeft, AlignCenter, AlignRight,
    Table, Image, Link2, Minus, Hash,
  }

  return (
    <AnimatePresence>
      {showCommandPalette && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={toggleCommandPalette}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed z-50 top-[15%] left-1/2 -translate-x-1/2 w-[600px] glass-strong rounded-xl overflow-hidden shadow-neon-lg"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-koppa-border">
              <Search size={16} className="text-koppa-neon shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-koppa-text placeholder-koppa-dim outline-none text-sm"
              />
              <kbd className="text-koppa-dim text-xs border border-koppa-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <div className="text-koppa-dim text-sm text-center py-8">No commands found</div>
              )}

              {query
                ? filtered.map((cmd, i) => {
                    const Icon = iconMap[cmd.icon ?? 'FileText'] ?? FileText
                    return (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        Icon={Icon}
                        selected={i === selected}
                        onClick={() => execute(cmd)}
                      />
                    )
                  })
                : Array.from(grouped).map(([cat, cmds]) => (
                    <div key={cat}>
                      <div className="px-4 py-1.5 text-koppa-dim text-xs font-medium tracking-widest uppercase">
                        {cat}
                      </div>
                      {cmds.map((cmd, i) => {
                        const Icon = iconMap[cmd.icon ?? 'FileText'] ?? FileText
                        const globalIdx = filtered.indexOf(cmd)
                        return (
                          <CommandRow
                            key={cmd.id}
                            cmd={cmd}
                            Icon={Icon}
                            selected={globalIdx === selected}
                            onClick={() => execute(cmd)}
                          />
                        )
                      })}
                    </div>
                  ))
              }
            </div>

            {/* Footer */}
            <div className="border-t border-koppa-border px-4 py-2 flex items-center gap-4 text-koppa-dim text-xs">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">Ctrl+K</kbd> toggle</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function CommandRow({ cmd, Icon, selected, onClick }: {
  cmd: Command; Icon: React.ElementType; selected: boolean; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'command-item',
        selected && 'bg-koppa-hover',
      )}
    >
      <div className={clsx(
        'w-7 h-7 rounded flex items-center justify-center shrink-0',
        selected ? 'bg-koppa-neon/20 text-koppa-neon' : 'bg-koppa-card text-koppa-muted',
      )}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={clsx('text-sm', selected ? 'text-koppa-text' : 'text-koppa-muted')}>
          {cmd.label}
        </div>
        {cmd.description && (
          <div className="text-xs text-koppa-dim">{cmd.description}</div>
        )}
      </div>
      {cmd.shortcut && (
        <kbd className="text-koppa-dim text-xs border border-koppa-border rounded px-1.5 py-0.5 font-mono shrink-0">
          {cmd.shortcut}
        </kbd>
      )}
    </div>
  )
}
