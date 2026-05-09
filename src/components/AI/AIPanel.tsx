import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Send, X, Copy, RefreshCw, Wand2,
  FileText, Languages, Zap, ChevronDown, Key,
} from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'
import { AIMessage } from '../../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const QUICK_ACTIONS = [
  { id: 'rewrite',   label: 'Rewrite',     icon: RefreshCw, prompt: 'Rewrite the selected text to be clearer and more professional.' },
  { id: 'summarize', label: 'Summarize',   icon: FileText,  prompt: 'Summarize the following text concisely.' },
  { id: 'translate', label: 'Translate',   icon: Languages, prompt: 'Translate the following text to English (detect source language):' },
  { id: 'expand',    label: 'Expand',      icon: Wand2,     prompt: 'Expand and elaborate on the following text with more detail.' },
  { id: 'fix',       label: 'Fix Grammar', icon: Zap,       prompt: 'Fix grammar, spelling, and punctuation in the following text.' },
  { id: 'formal',    label: 'Formal',      icon: Bot,       prompt: 'Rewrite the following text in a more formal, professional tone.' },
]

const isElectron = !!window.electronAPI

export default function AIPanel() {
  const { showAIPanel, toggleAIPanel, editor } = useEditorStore()
  const { getActiveDocument } = useDocumentStore()
  const [messages, setMessages]       = useState<AIMessage[]>([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [apiKey, setApiKey]           = useState('')
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Check if key already stored in Electron keystore
  useEffect(() => {
    if (!isElectron) return
    window.electronAPI!.ai.hasKey().then((has: unknown) => setHasStoredKey(!!has))
  }, [])

  const getSelectedText = () =>
    editor?.state.selection.empty
      ? null
      : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') ?? null

  const getDocContext = () => editor?.getText().slice(0, 2000) ?? ''

  const send = async (userPrompt: string) => {
    if (!userPrompt.trim()) return
    const selected = getSelectedText()
    const fullPrompt = selected
      ? `${userPrompt}\n\nSelected text:\n"${selected}"`
      : userPrompt

    const userMsg: AIMessage = { role: 'user', content: fullPrompt, timestamp: Date.now() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      let response: string

      if (isElectron) {
        // ✅ Goes through Electron main process — no HTTP server needed
        const result = await window.electronAPI!.ai.chat({
          message: fullPrompt,
          context: getDocContext(),
          history: messages.slice(-8),
          apiKey: apiKey || undefined,
        }) as { response: string }
        response = result.response
      } else {
        // Fallback: HTTP backend (dev mode without Electron)
        const res = await fetch('http://localhost:3001/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullPrompt,
            context: getDocContext(),
            history: messages.slice(-8),
            apiKey: apiKey || undefined,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        response = data.response
      }

      setMessages(m => [...m, { role: 'assistant', content: response, timestamp: Date.now() }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI request failed'
      toast.error(msg)
      setMessages(m => [...m, {
        role: 'assistant',
        content: `⚠️ ${msg}\n\nMake sure your Anthropic API key is set in the panel below.`,
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    const selected = getSelectedText()
    const text = selected ?? getDocContext().slice(0, 500)
    send(`${action.prompt}\n\n"${text}"`)
  }

  const insertToDocument = (text: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(text.replace(/^["']|["']$/g, '')).run()
    toast.success('Inserted into document')
  }

  const saveApiKey = async () => {
    if (!apiKey.trim()) return
    if (isElectron) {
      await window.electronAPI!.ai.storeKey(apiKey)
      setHasStoredKey(true)
      toast.success('API key saved securely')
    }
    setShowKeyInput(false)
  }

  return (
    <AnimatePresence>
      {showAIPanel && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col h-full border-l border-koppa-border w-80 shrink-0"
          style={{ background: 'rgba(8,8,16,0.97)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-koppa-border">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,47,255,0.3), rgba(0,212,255,0.3))',
                  border: '1px solid rgba(139,47,255,0.4)',
                }}
                animate={{ boxShadow: ['0 0 10px rgba(139,47,255,0.3)', '0 0 22px rgba(139,47,255,0.6)', '0 0 10px rgba(139,47,255,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bot size={14} className="text-koppa-purple" />
              </motion.div>
              <div>
                <div className="text-koppa-text text-sm font-medium">AI Assistant</div>
                <div className="text-koppa-dim text-xs">Claude · {hasStoredKey ? '🔑 key saved' : 'no key'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-koppa-dim hover:text-koppa-neon transition-colors p-1 rounded"
                title="API Key settings"
              >
                <Key size={13} />
              </button>
              <button onClick={toggleAIPanel} className="text-koppa-dim hover:text-koppa-text transition-colors p-1 rounded">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* API key input */}
          <AnimatePresence>
            {showKeyInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-koppa-border"
              >
                <div className="p-3 space-y-2">
                  <p className="text-koppa-dim text-xs">
                    Your key is stored {isElectron ? 'securely on this device' : 'in memory only'}.
                  </p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-koppa-card border border-koppa-border rounded px-2 py-1.5 text-xs text-koppa-text placeholder-koppa-dim outline-none focus:border-koppa-neon transition-colors"
                  />
                  <button
                    onClick={saveApiKey}
                    className="w-full py-1.5 rounded text-xs neon-btn"
                  >
                    {isElectron ? 'Save Key Securely' : 'Use Key (session only)'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions */}
          <div className="p-3 border-b border-koppa-border">
            <div className="text-koppa-dim text-xs mb-2 tracking-wider uppercase">Quick Actions</div>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-koppa-muted hover:text-koppa-text hover:bg-koppa-hover transition-colors text-xs disabled:opacity-40"
                >
                  <action.icon size={13} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot size={32} className="text-koppa-purple mx-auto mb-3 opacity-40" />
                <p className="text-koppa-dim text-sm">Ask me anything</p>
                <p className="text-koppa-dim text-xs mt-1 opacity-60">Select text first for Quick Actions</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={clsx(
                  'max-w-[88%] rounded-xl px-3 py-2 text-xs',
                  msg.role === 'user'
                    ? 'bg-koppa-neon/20 border border-koppa-neon/30 text-koppa-text ml-4'
                    : 'bg-koppa-card border border-koppa-border text-koppa-text',
                )}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-koppa-border">
                      <button
                        onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied') }}
                        className="flex items-center gap-1 text-koppa-dim hover:text-koppa-text transition-colors"
                      >
                        <Copy size={10} /> Copy
                      </button>
                      <button
                        onClick={() => insertToDocument(msg.content)}
                        className="flex items-center gap-1 text-koppa-neon hover:text-koppa-cyan transition-colors"
                      >
                        <FileText size={10} /> Insert
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-koppa-card border border-koppa-border rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-koppa-purple"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-koppa-border">
            <div className="flex items-end gap-2 bg-koppa-card border border-koppa-border rounded-xl px-3 py-2 focus-within:border-koppa-neon/50 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                placeholder="Ask AI… (Enter to send)"
                rows={2}
                className="flex-1 bg-transparent text-koppa-text placeholder-koppa-dim text-xs outline-none resize-none"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-koppa-neon hover:bg-koppa-neon/20 transition-colors disabled:opacity-30 shrink-0"
              >
                {loading
                  ? <motion.div className="w-4 h-4 border-2 border-koppa-neon border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  : <Send size={13} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
