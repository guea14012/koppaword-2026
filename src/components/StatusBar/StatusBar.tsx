import { motion } from 'framer-motion'
import {
  FileText, AlignLeft, Clock, Wifi, WifiOff,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'

export default function StatusBar() {
  const { wordCount, charCount, cursorLine, cursorCol, zoom } = useEditorStore()
  const { getActiveDocument } = useDocumentStore()
  const doc = getActiveDocument()

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="flex items-center justify-between h-7 px-3 border-t border-koppa-border text-xs font-mono select-none shrink-0"
      style={{ background: 'rgba(6,6,14,0.98)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-4 text-koppa-dim">
        {doc && (
          <div className="flex items-center gap-1.5">
            {doc.isDirty ? (
              <span className="flex items-center gap-1 text-koppa-warning">
                <Loader2 size={10} className="animate-spin" />
                Unsaved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-koppa-success">
                <CheckCircle2 size={10} />
                Saved
              </span>
            )}
          </div>
        )}
        <span className="flex items-center gap-1">
          <FileText size={10} />
          {doc?.title ?? 'No document'}
        </span>
        {doc?.filePath && (
          <span className="opacity-50 max-w-48 truncate">{doc.filePath}</span>
        )}
      </div>

      {/* Center */}
      <div className="flex items-center gap-4 text-koppa-dim">
        <span>{wordCount} words</span>
        <span>{charCount} chars</span>
        <span>Ln {cursorLine}, Col {cursorCol}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 text-koppa-dim">
        <span className="flex items-center gap-1">
          <AlignLeft size={10} />
          UTF-8
        </span>
        <span>{zoom}%</span>
        <motion.div
          className="flex items-center gap-1 text-koppa-neon"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-koppa-neon" />
          <span>KOPPAWORD 2026</span>
        </motion.div>
        <span className="text-koppa-dim opacity-60">{formatTime()}</span>
      </div>
    </div>
  )
}
