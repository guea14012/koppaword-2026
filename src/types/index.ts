export interface KoppaDocument {
  id: string
  title: string
  content: string
  filePath: string | null
  isDirty: boolean
  isNew: boolean
  createdAt: number
  updatedAt: number
  wordCount: number
  charCount: number
  language: string
  encrypted: boolean
}

export interface EditorTab {
  id: string
  documentId: string
  title: string
  isActive: boolean
  isDirty: boolean
}

export interface FormattingState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  code: boolean
  textColor: string
  highlightColor: string
  fontFamily: string
  fontSize: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  heading: number | null
  bulletList: boolean
  orderedList: boolean
  taskList: boolean
  blockquote: boolean
  subscript: boolean
  superscript: boolean
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageWidth: number
  showRuler: boolean
  showWordCount: boolean
  autoSave: boolean
  autoSaveInterval: number
  spellCheck: boolean
  grammarCheck: boolean
  aiEnabled: boolean
  aiProvider: 'anthropic' | 'openai' | 'local'
  apiKey: string
  sidebarVisible: boolean
  aiPanelVisible: boolean
  toolbar: 'ribbon' | 'compact' | 'minimal'
  zoom: number
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  icon?: string
  category: string
  action: () => void
}

export interface FindReplaceState {
  isOpen: boolean
  query: string
  replacement: string
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  matchCount: number
  currentMatch: number
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'txt' | 'md'
  includeHeaders: boolean
  includeFooters: boolean
  pageSize: 'a4' | 'letter' | 'a3'
  margins: { top: number; bottom: number; left: number; right: number }
}

export interface RecentFile {
  path: string
  title: string
  timestamp: number
}
