import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(13,13,26,0.95)',
          color: '#e0e4ff',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(12px)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        },
        success: {
          iconTheme: { primary: '#00ff88', secondary: '#080810' },
        },
        error: {
          iconTheme: { primary: '#ff3355', secondary: '#080810' },
        },
      }}
    />
  </React.StrictMode>,
)
