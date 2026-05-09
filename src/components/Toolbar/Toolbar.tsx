import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold, Italic, Underline, Strikethrough, Code2, Link2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Minus,
  Image, Table, Subscript, Superscript,
  Type, Palette, Highlighter,
  Undo2, Redo2,
  Search, Maximize2, ZoomIn, ZoomOut,
  FileDown, Columns2,
} from 'lucide-react'
import clsx from 'clsx'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'

const FONTS = ['Inter', 'Space Grotesk', 'JetBrains Mono', 'Georgia', 'Arial', 'Times New Roman', 'Roboto']
const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]
const HEADINGS = [
  { label: 'Normal', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
]

function Btn({ onClick, active, title, children, disabled = false }: {
  onClick: () => void; active?: boolean; title: string;
  children: React.ReactNode; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx('toolbar-btn', active && 'active', disabled && 'opacity-30 cursor-not-allowed')}
    >
      {children}
    </button>
  )
}

function Sep() { return <div className="toolbar-separator" /> }

export default function Toolbar() {
  const { editor, formatting, zoom, setZoom, toggleCommandPalette, toggleFindReplace } = useEditorStore()
  const { getActiveDocument } = useDocumentStore()
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'format' | 'view'>('home')
  const [showFontDropdown, setShowFontDropdown] = useState(false)
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [fontSizeInput, setFontSizeInput] = useState(String(formatting.fontSize))
  const doc = getActiveDocument()

  if (!editor) return null

  const cmd = <T,>(fn: () => T) => { editor.chain().focus(); return fn() }

  const setFontSize = (size: number) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run()
    setFontSizeInput(String(size))
  }

  const tabStyle = (t: string) => clsx(
    'px-4 py-1.5 text-xs font-medium tracking-wider transition-colors cursor-pointer',
    activeTab === t ? 'text-koppa-neon border-b-2 border-koppa-neon' : 'text-koppa-muted hover:text-koppa-text',
  )

  return (
    <div
      className="border-b border-koppa-border select-none"
      style={{ background: 'rgba(11,11,22,0.97)' }}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-koppa-border px-2">
        {(['home', 'insert', 'format', 'view'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={tabStyle(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={toggleFindReplace}
          className="toolbar-btn mr-1" title="Find & Replace (Ctrl+H)"
        >
          <Search size={14} />
        </button>
      </div>

      {/* Ribbon content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="flex items-center flex-wrap gap-0.5 px-2 py-1.5"
        >
          {activeTab === 'home' && (
            <>
              {/* Undo/Redo */}
              <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
                <Undo2 size={14} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
                <Redo2 size={14} />
              </Btn>
              <Sep />

              {/* Heading dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowHeadingDropdown(!showHeadingDropdown); setShowFontDropdown(false) }}
                  className="flex items-center gap-1 px-2 h-8 rounded text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover text-xs transition-colors min-w-[90px]"
                >
                  <Type size={12} />
                  <span>{formatting.heading ? `Heading ${formatting.heading}` : 'Normal'}</span>
                  <span className="ml-auto opacity-50">▾</span>
                </button>
                {showHeadingDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 z-50 glass-strong rounded-lg overflow-hidden shadow-panel w-40"
                    onMouseLeave={() => setShowHeadingDropdown(false)}
                  >
                    {HEADINGS.map(h => (
                      <button
                        key={h.value}
                        onClick={() => {
                          if (h.value === 0) editor.chain().focus().setParagraph().run()
                          else editor.chain().focus().toggleHeading({ level: h.value as 1|2|3 }).run()
                          setShowHeadingDropdown(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-xs text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors"
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Sep />

              {/* Font family */}
              <div className="relative">
                <button
                  onClick={() => { setShowFontDropdown(!showFontDropdown); setShowHeadingDropdown(false) }}
                  className="flex items-center gap-1 px-2 h-8 rounded text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover text-xs transition-colors min-w-[100px]"
                >
                  <span className="truncate">{formatting.fontFamily}</span>
                  <span className="ml-auto opacity-50">▾</span>
                </button>
                {showFontDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 z-50 glass-strong rounded-lg overflow-hidden shadow-panel w-48 max-h-56 overflow-y-auto"
                    onMouseLeave={() => setShowFontDropdown(false)}
                  >
                    {FONTS.map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          editor.chain().focus().setFontFamily(f).run()
                          setShowFontDropdown(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-xs text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors"
                        style={{ fontFamily: f }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font size */}
              <div className="flex items-center h-8 border border-koppa-border rounded overflow-hidden mx-0.5">
                <button
                  onClick={() => setFontSize(Math.max(8, formatting.fontSize - 1))}
                  className="w-5 h-full text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover flex items-center justify-center text-xs transition-colors"
                >−</button>
                <input
                  type="text"
                  value={fontSizeInput}
                  onChange={e => setFontSizeInput(e.target.value)}
                  onBlur={() => {
                    const n = parseInt(fontSizeInput)
                    if (!isNaN(n) && n >= 8 && n <= 144) setFontSize(n)
                    else setFontSizeInput(String(formatting.fontSize))
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  className="w-8 text-center bg-transparent text-koppa-text text-xs outline-none"
                />
                <button
                  onClick={() => setFontSize(Math.min(144, formatting.fontSize + 1))}
                  className="w-5 h-full text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover flex items-center justify-center text-xs transition-colors"
                >+</button>
              </div>
              <Sep />

              {/* Text formatting */}
              <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={formatting.bold} title="Bold (Ctrl+B)">
                <Bold size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={formatting.italic} title="Italic (Ctrl+I)">
                <Italic size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={formatting.underline} title="Underline (Ctrl+U)">
                <Underline size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={formatting.strike} title="Strikethrough">
                <Strikethrough size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={formatting.code} title="Inline Code">
                <Code2 size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={formatting.subscript} title="Subscript">
                <Subscript size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={formatting.superscript} title="Superscript">
                <Superscript size={13} />
              </Btn>
              <Sep />

              {/* Color */}
              <label className="toolbar-btn cursor-pointer relative" title="Text Color">
                <Palette size={13} />
                <input
                  type="color"
                  defaultValue="#e0e4ff"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={e => editor.chain().focus().setColor(e.target.value).run()}
                />
              </label>
              <label className="toolbar-btn cursor-pointer relative" title="Highlight Color">
                <Highlighter size={13} />
                <input
                  type="color"
                  defaultValue="#ffaa00"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                />
              </label>
              <Sep />

              {/* Alignment */}
              <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={formatting.textAlign === 'left'} title="Align Left">
                <AlignLeft size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={formatting.textAlign === 'center'} title="Align Center">
                <AlignCenter size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={formatting.textAlign === 'right'} title="Align Right">
                <AlignRight size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={formatting.textAlign === 'justify'} title="Justify">
                <AlignJustify size={13} />
              </Btn>
              <Sep />

              {/* Lists */}
              <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={formatting.bulletList} title="Bullet List">
                <List size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={formatting.orderedList} title="Numbered List">
                <ListOrdered size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={formatting.taskList} title="Task List">
                <CheckSquare size={13} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={formatting.blockquote} title="Blockquote">
                <Quote size={13} />
              </Btn>
            </>
          )}

          {activeTab === 'insert' && (
            <>
              <Btn onClick={() => {
                const url = prompt('Enter URL:')
                if (url) editor.chain().focus().setLink({ href: url }).run()
              }} title="Insert Link" active={editor.isActive('link')}>
                <Link2 size={14} />
              </Btn>
              <Btn onClick={() => {
                const url = prompt('Image URL:')
                if (url) editor.chain().focus().setImage({ src: url }).run()
              }} title="Insert Image">
                <Image size={14} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
                <Table size={14} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                <Minus size={14} />
              </Btn>
              <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                <Code2 size={14} />
              </Btn>
            </>
          )}

          {activeTab === 'format' && (
            <>
              <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
                <Type size={14} />
              </Btn>
            </>
          )}

          {activeTab === 'view' && (
            <>
              <Btn onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom Out">
                <ZoomOut size={14} />
              </Btn>
              <span className="text-koppa-muted text-xs px-2 font-mono">{zoom}%</span>
              <Btn onClick={() => setZoom(Math.min(200, zoom + 10))} title="Zoom In">
                <ZoomIn size={14} />
              </Btn>
              <Btn onClick={() => setZoom(100)} title="Reset Zoom">
                <span className="text-xs font-mono">100%</span>
              </Btn>
              <Sep />
              <Btn onClick={() => useEditorStore.getState().toggleFocusMode()} title="Focus Mode (F11)">
                <Maximize2 size={14} />
              </Btn>
              <Sep />
              <Btn onClick={() => {}} title="Split View">
                <Columns2 size={14} />
              </Btn>
              <Sep />
              <Btn onClick={() => {
                const html = editor.getHTML()
                const blob = new Blob([html], { type: 'text/html' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${doc?.title ?? 'document'}.html`
                a.click()
              }} title="Export as HTML">
                <FileDown size={14} />
              </Btn>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
