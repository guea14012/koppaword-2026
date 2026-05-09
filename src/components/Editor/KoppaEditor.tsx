import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import FontFamily from '@tiptap/extension-font-family'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { createLowlight, common } from 'lowlight'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'
import clsx from 'clsx'

const lowlight = createLowlight(common)

export default function KoppaEditor() {
  const { setEditor, syncFormattingFromEditor, setStats, zoom, focusMode } = useEditorStore()
  const { getActiveDocument, updateDocument } = useDocumentStore()
  const doc = getActiveDocument()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: 'Begin your document…' }),
      CodeBlockLowlight.configure({ lowlight }),
      FontFamily,
      Typography,
      CharacterCount,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: doc?.content ?? '<p></p>',
    autofocus: 'end',
    onUpdate({ editor }) {
      syncFormattingFromEditor()

      const storage = editor.storage.characterCount
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = storage?.characters() ?? text.length
      setStats(words, chars, 1, 1)

      if (doc) {
        updateDocument(doc.id, {
          content: editor.getHTML(),
          wordCount: words,
          charCount: chars,
          isDirty: true,
        })
      }
    },
    onSelectionUpdate() {
      syncFormattingFromEditor()
    },
  })

  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  // When active document changes, update editor content
  useEffect(() => {
    if (editor && doc && editor.getHTML() !== doc.content) {
      editor.commands.setContent(doc.content, false)
    }
  }, [doc?.id])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      useEditorStore.getState().toggleCommandPalette()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault()
      useEditorStore.getState().toggleFindReplace()
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault()
      useEditorStore.getState().toggleAIPanel()
    }
    if (e.key === 'F11') {
      e.preventDefault()
      useEditorStore.getState().toggleFocusMode()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Drag & drop images
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result && editor) {
          editor.chain().focus().setImage({ src: ev.target.result as string }).run()
        }
      }
      reader.readAsDataURL(file)
    })
  }, [editor])

  const pageStyle: React.CSSProperties = {
    width: `calc(var(--editor-width) * ${zoom / 100})`,
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
  }

  return (
    <div
      className={clsx('koppa-editor-wrap', focusMode && 'focus-mode')}
      style={{ background: focusMode ? 'transparent' : 'rgba(4,4,12,0.9)' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <div className="koppa-page" style={zoom !== 100 ? pageStyle : undefined}>
        {/* Page number decoration */}
        <div className="absolute top-3 right-4 text-koppa-dim text-xs font-mono opacity-40">
          {doc?.title ?? 'Untitled'}
        </div>

        <EditorContent editor={editor} className="select-text" />
      </div>
    </div>
  )
}
