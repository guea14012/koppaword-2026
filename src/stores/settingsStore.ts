import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaults: AppSettings = {
  theme: 'dark',
  fontFamily: 'Inter',
  fontSize: 16,
  lineHeight: 1.7,
  pageWidth: 820,
  showRuler: false,
  showWordCount: true,
  autoSave: true,
  autoSaveInterval: 30,
  spellCheck: true,
  grammarCheck: false,
  aiEnabled: true,
  aiProvider: 'anthropic',
  apiKey: '',
  sidebarVisible: true,
  aiPanelVisible: false,
  toolbar: 'ribbon',
  zoom: 100,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaults,
      updateSettings: (updates) =>
        set(s => ({ settings: { ...s.settings, ...updates } })),
      resetSettings: () => set({ settings: defaults }),
    }),
    {
      name: 'koppaword-settings',
    },
  ),
)
