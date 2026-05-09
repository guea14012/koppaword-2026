import { create } from 'zustand'
import type { Editor } from '@tiptap/react'
import { FormattingState, FindReplaceState } from '../types'

interface EditorStore {
  editor: Editor | null
  setEditor: (editor: Editor | null) => void

  formatting: FormattingState
  updateFormatting: (updates: Partial<FormattingState>) => void
  syncFormattingFromEditor: () => void

  zoom: number
  setZoom: (zoom: number) => void

  focusMode: boolean
  toggleFocusMode: () => void

  presentationMode: boolean
  togglePresentationMode: () => void

  wordCount: number
  charCount: number
  cursorLine: number
  cursorCol: number
  setStats: (wc: number, cc: number, line: number, col: number) => void

  findReplace: FindReplaceState
  setFindReplace: (updates: Partial<FindReplaceState>) => void

  showCommandPalette: boolean
  toggleCommandPalette: () => void

  showAIPanel: boolean
  toggleAIPanel: () => void

  showSidebar: boolean
  toggleSidebar: () => void

  showFindReplace: boolean
  toggleFindReplace: () => void
}

const defaultFormatting: FormattingState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  textColor: '#e0e4ff',
  highlightColor: '',
  fontFamily: 'Inter',
  fontSize: 16,
  textAlign: 'left',
  heading: null,
  bulletList: false,
  orderedList: false,
  taskList: false,
  blockquote: false,
  subscript: false,
  superscript: false,
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),

  formatting: defaultFormatting,
  updateFormatting: (updates) =>
    set(s => ({ formatting: { ...s.formatting, ...updates } })),

  syncFormattingFromEditor: () => {
    const { editor } = get()
    if (!editor) return
    set({
      formatting: {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        code: editor.isActive('code'),
        textColor: editor.getAttributes('textStyle').color ?? '#e0e4ff',
        highlightColor: editor.getAttributes('highlight').color ?? '',
        fontFamily: editor.getAttributes('textStyle').fontFamily ?? 'Inter',
        fontSize: parseInt(editor.getAttributes('textStyle').fontSize ?? '16'),
        textAlign: (editor.isActive({ textAlign: 'center' }) ? 'center'
          : editor.isActive({ textAlign: 'right' }) ? 'right'
          : editor.isActive({ textAlign: 'justify' }) ? 'justify'
          : 'left') as FormattingState['textAlign'],
        heading: editor.isActive('heading', { level: 1 }) ? 1
          : editor.isActive('heading', { level: 2 }) ? 2
          : editor.isActive('heading', { level: 3 }) ? 3
          : null,
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        taskList: editor.isActive('taskList'),
        blockquote: editor.isActive('blockquote'),
        subscript: editor.isActive('subscript'),
        superscript: editor.isActive('superscript'),
      },
    })
  },

  zoom: 100,
  setZoom: (zoom) => set({ zoom }),

  focusMode: false,
  toggleFocusMode: () => set(s => ({ focusMode: !s.focusMode })),

  presentationMode: false,
  togglePresentationMode: () => set(s => ({ presentationMode: !s.presentationMode })),

  wordCount: 0,
  charCount: 0,
  cursorLine: 1,
  cursorCol: 1,
  setStats: (wc, cc, line, col) => set({ wordCount: wc, charCount: cc, cursorLine: line, cursorCol: col }),

  findReplace: {
    isOpen: false,
    query: '',
    replacement: '',
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    matchCount: 0,
    currentMatch: 0,
  },
  setFindReplace: (updates) =>
    set(s => ({ findReplace: { ...s.findReplace, ...updates } })),

  showCommandPalette: false,
  toggleCommandPalette: () => set(s => ({ showCommandPalette: !s.showCommandPalette })),

  showAIPanel: false,
  toggleAIPanel: () => set(s => ({ showAIPanel: !s.showAIPanel })),

  showSidebar: true,
  toggleSidebar: () => set(s => ({ showSidebar: !s.showSidebar })),

  showFindReplace: false,
  toggleFindReplace: () => set(s => ({ showFindReplace: !s.showFindReplace })),
}))
