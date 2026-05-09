import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { useDocumentStore } from '../../stores/documentStore'

declare global {
  interface Window {
    electronAPI?: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
      }
    }
  }
}

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const { getActiveDocument } = useDocumentStore()
  const doc = getActiveDocument()

  useEffect(() => {
    window.electronAPI?.window.isMaximized().then(setIsMaximized)
  }, [])

  const isElectron = !!window.electronAPI

  return (
    <div
      className="flex items-center justify-between h-9 border-b border-koppa-border select-none shrink-0"
      style={{
        background: 'rgba(6,6,14,0.99)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 px-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <motion.div
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-display"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,102,255,0.3))',
            border: '1px solid rgba(0,212,255,0.5)',
            color: '#00d4ff',
          }}
          animate={{ boxShadow: ['0 0 6px rgba(0,212,255,0.3)', '0 0 12px rgba(0,212,255,0.6)', '0 0 6px rgba(0,212,255,0.3)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          K
        </motion.div>
        <span
          className="text-xs font-medium font-display tracking-wider"
          style={{ background: 'linear-gradient(90deg, #00d4ff, #8b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          KOPPAWORD 2026
        </span>
      </div>

      {/* Center: Document title */}
      <div className="flex-1 text-center" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <span className="text-koppa-muted text-xs">
          {doc ? `${doc.isDirty ? '● ' : ''}${doc.title}` : 'No document'}
        </span>
      </div>

      {/* Right: Window controls */}
      {isElectron && (
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => window.electronAPI?.window.minimize()}
            className="flex items-center justify-center w-10 h-9 text-koppa-dim hover:text-koppa-text hover:bg-koppa-hover transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={() => { window.electronAPI?.window.maximize(); setIsMaximized(!isMaximized) }}
            className="flex items-center justify-center w-10 h-9 text-koppa-dim hover:text-koppa-text hover:bg-koppa-hover transition-colors"
          >
            {isMaximized ? <Square size={11} /> : <Maximize2 size={11} />}
          </button>
          <button
            onClick={() => window.electronAPI?.window.close()}
            className="flex items-center justify-center w-10 h-9 text-koppa-dim hover:text-white hover:bg-koppa-danger transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
