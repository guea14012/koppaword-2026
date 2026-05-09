# KOPPAWORD 2026

> Futuristic Cross-Platform Document Editor by KoppaZZZ

```
  ██╗  ██╗ ██████╗ ██████╗ ██████╗  █████╗ ██╗    ██╗ ██████╗ ██████╗ ██████╗
  ██║ ██╔╝██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██║    ██║██╔═══██╗██╔══██╗██╔══██╗
  █████╔╝ ██║   ██║██████╔╝██████╔╝███████║██║ █╗ ██║██║   ██║██████╔╝██║  ██║
  ██╔═██╗ ██║   ██║██╔═══╝ ██╔═══╝ ██╔══██║██║███╗██║██║   ██║██╔══██╗██║  ██║
  ██║  ██╗╚██████╔╝██║     ██║     ██║  ██║╚███╔███╔╝╚██████╔╝██║  ██║██████╔╝
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝
                                                          2 0 2 6   E D I T I O N
```

---

## Overview

KOPPAWORD 2026 is a professional document editor with a futuristic cyberpunk identity. Built on Electron + React + TipTap, it delivers enterprise-grade editing features wrapped in a neon-dark glassmorphism UI.

**Design language:** Professional office suite meets Cyber OS. Neon blue/black palette, glassmorphism panels, animated UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Desktop | Electron 29 |
| Build | Vite 5 + vite-plugin-electron |
| Rich Text | TipTap v2 (ProseMirror-based) |
| Styling | TailwindCSS 3 + Framer Motion |
| State | Zustand 4 |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude API |
| Icons | Lucide React |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd "KOPPAWORD 2026"
npm install
```

### Development (Browser mode)

```bash
npm run dev
# Opens at http://localhost:5173
```

### Development (Electron mode)

Start the backend in one terminal:
```bash
npm run backend
```

Start Electron in another:
```bash
npm run electron:dev
```

Or run both concurrently:
```bash
npm start
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

The AI features require an Anthropic API key. You can also set it per-session in the AI panel inside the app.

---

## Building for Production

```bash
# Build renderer + Electron
npm run build:all

# Windows installer
npm run dist

# Output: release/ directory
```

Supported targets:
- **Windows**: NSIS installer (`.exe`)
- **Linux**: AppImage
- **macOS**: DMG

---

## Project Structure

```
KOPPAWORD 2026/
├── electron/
│   ├── main.ts           # Electron main process (window, IPC, menus)
│   └── preload.ts        # Context bridge (secure IPC)
│
├── src/
│   ├── components/
│   │   ├── AI/           # AI writing assistant panel
│   │   ├── CommandPalette/ # Floating command palette (Ctrl+K)
│   │   ├── Editor/       # TipTap editor instance
│   │   ├── FindReplace/  # Find & Replace dialog
│   │   ├── Sidebar/      # File explorer, outline, recent, search
│   │   ├── SplashScreen/ # Animated boot screen
│   │   ├── StatusBar/    # Bottom status bar
│   │   ├── Tabs/         # Multi-document tab bar
│   │   ├── TitleBar/     # Custom window chrome
│   │   └── Toolbar/      # Ribbon formatting toolbar
│   │
│   ├── stores/
│   │   ├── editorStore.ts    # Editor state (formatting, zoom, panels)
│   │   ├── documentStore.ts  # Document management & tabs
│   │   └── settingsStore.ts  # Persisted app settings
│   │
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   │
│   ├── styles/
│   │   └── globals.css   # TailwindCSS + TipTap + animations
│   │
│   ├── App.tsx           # Root component
│   └── main.tsx          # React entry point
│
├── backend/
│   ├── server.ts         # Express server (port 3001)
│   ├── db/
│   │   └── database.ts   # SQLite schema & connection
│   └── routes/
│       ├── documents.ts  # CRUD + version history
│       └── ai.ts         # AI endpoints (chat, grammar, templates)
│
├── assets/               # App icons
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Features

### Rich Text Editing
- Bold, Italic, Underline, Strikethrough, Code
- Subscript & Superscript
- Font family & size control
- Text color & highlight (custom color picker)
- Paragraph alignment (left, center, right, justify)
- Headings H1-H6 with neon styling
- Bullet lists, numbered lists, task lists (checkboxes)
- Blockquotes with neon left border
- Tables with resize support
- Image embedding (URL or drag & drop)
- Hyperlinks
- Horizontal rules
- Code blocks with syntax highlighting (lowlight/highlight.js)
- Typography smart punctuation

### Editor Features
- Undo/Redo
- Find & Replace (with case-sensitive, whole-word options)
- Multi-tab document editing
- Word count & character count (live)
- Drag & drop image import
- Zoom 50%-200%
- Focus Mode (distraction-free full-screen editing)
- Presentation Mode

### AI Features (requires API key)
- **Rewrite** - Improve clarity and style
- **Summarize** - Condense document or selection
- **Translate** - Auto-detect and translate
- **Expand** - Elaborate on brief content
- **Fix Grammar** - Correct errors
- **Make Formal** - Professional tone
- **Free chat** - Ask anything about the document
- Grammar check endpoint
- Template generation

### Command Palette (Ctrl+K)
- 30+ commands searchable by name
- Fuzzy search with keyboard navigation
- Shows all formatting, insert, view, and AI commands
- Keyboard shortcut hints

### Sidebar Panels
- **Explorer** - Open documents list
- **Outline** - Heading structure navigation
- **Recent** - Recently opened files
- **Search** - Full-text search in current document

### File Support
- `.kwdoc` — Native KOPPAWORD format (JSON)
- `.txt` / `.md` — Plain text import
- `.docx` — Word document import (mammoth.js)
- Export: HTML, PDF (print dialog)

### UI/UX
- Animated splash screen with boot progress
- Custom frameless window with neon titlebar
- Glassmorphism panels
- Animated ribbon toolbar with tab groups
- Dark neon theme (neon blue + void black)
- Smooth Framer Motion animations throughout
- Custom scrollbars
- Toast notifications

### Auto-Save
- 30-second auto-save interval (configurable)
- Dirty state indicator in tabs and status bar
- Save shortcut: Ctrl+S

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New document |
| Ctrl+O | Open file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+K | Command palette |
| Ctrl+H | Find & Replace |
| Ctrl+Shift+A | Toggle AI panel |
| Ctrl+B | Toggle sidebar |
| F11 | Focus mode |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+= / Ctrl+- | Zoom in/out |
| Ctrl+0 | Reset zoom |

---

## API Reference

### Backend (localhost:3001)

```
GET    /health                    Health check
GET    /api/documents             List documents
GET    /api/documents/:id         Get document
POST   /api/documents             Create document
PUT    /api/documents/:id         Update document
DELETE /api/documents/:id         Delete document
GET    /api/documents/:id/versions Version history

POST   /api/ai/chat               AI chat (Claude)
POST   /api/ai/grammar            Grammar check
POST   /api/ai/summarize          Summarize text
POST   /api/ai/template           Generate template
```

---

## Customization

### Themes
Modify `tailwind.config.js` to change the color palette:
```js
koppa: {
  neon: '#00d4ff',    // Primary neon color
  purple: '#8b2fff',  // Secondary accent
  bg: '#080810',      // Background
}
```

### Editor Extensions
Add TipTap extensions in `src/components/Editor/KoppaEditor.tsx`.

### AI Provider
Change the model in `backend/routes/ai.ts`:
```ts
model: 'claude-opus-4-7',  // Most capable
model: 'claude-sonnet-4-6', // Balanced (default)
model: 'claude-haiku-4-5-20251001', // Fastest
```

---

## Deployment

### Desktop Distribution

```bash
npm run dist
# Output: release/KOPPAWORD 2026 Setup.exe (Windows)
```

### Backend as Service (optional)

```bash
cd backend
npx ts-node server.ts
# Or compile and run with PM2:
pm2 start dist/server.js --name koppaword-backend
```

---

## Roadmap

- [ ] Real-time collaborative editing (WebRTC/WebSocket)
- [ ] Cloud sync (S3/custom backend)
- [ ] Voice typing (Web Speech API)
- [ ] OCR import (Tesseract.js)
- [ ] Plugin marketplace
- [ ] `.docx` export (docx.js)
- [ ] Built-in PDF renderer
- [ ] Screenshot annotation tool
- [ ] End-to-end encryption for `.kwdoc` files
- [ ] Mobile companion app

---

## License

MIT © 2026 KoppaZZZ

---

*KOPPAWORD 2026 — Document Intelligence for the Future*
