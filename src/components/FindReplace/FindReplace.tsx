import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Replace, X, ChevronUp, ChevronDown, CaseSensitive, WholeWord } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import clsx from 'clsx'

export default function FindReplace() {
  const { showFindReplace, toggleFindReplace, editor } = useEditorStore()
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [mode, setMode] = useState<'find' | 'replace'>('find')
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showFindReplace) inputRef.current?.focus()
  }, [showFindReplace])

  useEffect(() => {
    if (!query || !editor) {
      setMatchCount(0)
      setCurrentMatch(0)
      return
    }
    // Count matches in document text
    const text = editor.getText()
    const flags = caseSensitive ? 'g' : 'gi'
    let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (wholeWord) pattern = `\\b${pattern}\\b`
    try {
      const matches = text.match(new RegExp(pattern, flags)) ?? []
      setMatchCount(matches.length)
    } catch {
      setMatchCount(0)
    }
  }, [query, caseSensitive, wholeWord, editor])

  const findNext = () => {
    if (!editor || !query) return
    editor.commands.focus()
    setCurrentMatch(c => Math.min(c + 1, matchCount))
  }

  const findPrev = () => {
    if (!editor || !query) return
    editor.commands.focus()
    setCurrentMatch(c => Math.max(c - 1, 1))
  }

  const replaceOne = () => {
    if (!editor || !query) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    const matches = caseSensitive
      ? selectedText === query
      : selectedText.toLowerCase() === query.toLowerCase()
    if (matches) {
      editor.chain().focus().deleteSelection().insertContent(replacement).run()
    } else {
      findNext()
    }
  }

  const replaceAll = () => {
    if (!editor || !query) return
    const html = editor.getHTML()
    const flags = caseSensitive ? 'g' : 'gi'
    let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (wholeWord) pattern = `\\b${pattern}\\b`
    try {
      const newHtml = html.replace(new RegExp(pattern, flags), replacement)
      editor.commands.setContent(newHtml)
    } catch { /* invalid regex */ }
  }

  return (
    <AnimatePresence>
      {showFindReplace && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="absolute top-0 right-4 z-30 mt-2 glass-strong rounded-xl shadow-panel overflow-hidden w-80"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-koppa-border">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setMode('find')}
                className={clsx('px-2 py-1 rounded transition-colors', mode === 'find' ? 'text-koppa-neon bg-koppa-hover' : 'text-koppa-muted hover:text-koppa-text')}
              >
                Find
              </button>
              <button
                onClick={() => setMode('replace')}
                className={clsx('px-2 py-1 rounded transition-colors', mode === 'replace' ? 'text-koppa-neon bg-koppa-hover' : 'text-koppa-muted hover:text-koppa-text')}
              >
                Replace
              </button>
            </div>
            <button onClick={toggleFindReplace} className="text-koppa-dim hover:text-koppa-text transition-colors">
              <X size={13} />
            </button>
          </div>

          <div className="p-3 space-y-2">
            {/* Find input */}
            <div className="flex items-center gap-2 bg-koppa-card border border-koppa-border rounded-lg px-2 focus-within:border-koppa-neon/50 transition-colors">
              <Search size={12} className="text-koppa-dim shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.shiftKey ? findPrev() : findNext()
                  if (e.key === 'Escape') toggleFindReplace()
                }}
                placeholder="Find..."
                className="flex-1 bg-transparent text-koppa-text placeholder-koppa-dim text-xs outline-none py-1.5"
              />
              {matchCount > 0 && (
                <span className="text-koppa-dim text-xs shrink-0">
                  {currentMatch}/{matchCount}
                </span>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  className={clsx('w-5 h-5 rounded text-xs flex items-center justify-center transition-colors', caseSensitive ? 'text-koppa-neon bg-koppa-hover' : 'text-koppa-dim hover:text-koppa-muted')}
                  title="Case sensitive"
                >
                  Aa
                </button>
                <button
                  onClick={() => setWholeWord(!wholeWord)}
                  className={clsx('w-5 h-5 rounded text-xs flex items-center justify-center transition-colors', wholeWord ? 'text-koppa-neon bg-koppa-hover' : 'text-koppa-dim hover:text-koppa-muted')}
                  title="Whole word"
                >
                  W
                </button>
              </div>
            </div>

            {/* Replace input */}
            <AnimatePresence>
              {mode === 'replace' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 bg-koppa-card border border-koppa-border rounded-lg px-2 focus-within:border-koppa-neon/50 transition-colors">
                    <Replace size={12} className="text-koppa-dim shrink-0" />
                    <input
                      type="text"
                      value={replacement}
                      onChange={e => setReplacement(e.target.value)}
                      placeholder="Replace with..."
                      className="flex-1 bg-transparent text-koppa-text placeholder-koppa-dim text-xs outline-none py-1.5"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={findPrev} className="w-7 h-7 rounded flex items-center justify-center text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors" title="Previous (Shift+Enter)">
                <ChevronUp size={13} />
              </button>
              <button onClick={findNext} className="w-7 h-7 rounded flex items-center justify-center text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors" title="Next (Enter)">
                <ChevronDown size={13} />
              </button>
              {mode === 'replace' && (
                <>
                  <button
                    onClick={replaceOne}
                    className="px-3 h-7 rounded text-xs text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors border border-koppa-border"
                  >
                    Replace
                  </button>
                  <button
                    onClick={replaceAll}
                    className="px-3 h-7 rounded text-xs neon-btn"
                  >
                    Replace All
                  </button>
                </>
              )}
              {!matchCount && query && (
                <span className="text-koppa-danger text-xs ml-auto">No matches</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
