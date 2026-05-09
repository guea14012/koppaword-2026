import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

const NATIVE_EXTERNALS = [
  'better-sqlite3',
  'electron-store',
  'anthropic',
]

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            minify: false,
            rollupOptions: {
              external: ['electron', ...NATIVE_EXTERNALS, 'path', 'fs', 'os'],
            },
          },
        },
      },
      {
        // Preload
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
        onstart(options) { options.reload() },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          tiptap:  ['@tiptap/react', '@tiptap/core', '@tiptap/starter-kit'],
          framer:  ['framer-motion'],
          lucide:  ['lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['electron', ...NATIVE_EXTERNALS],
  },
})
