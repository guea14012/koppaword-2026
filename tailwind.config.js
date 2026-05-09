/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        koppa: {
          void:    '#04040c',
          bg:      '#080810',
          surface: '#0d0d1a',
          panel:   '#111120',
          card:    '#161628',
          border:  '#1e1e38',
          hover:   '#242444',
          neon:    '#00d4ff',
          neon2:   '#0066ff',
          cyan:    '#00ffee',
          purple:  '#8b2fff',
          pink:    '#ff2d78',
          text:    '#e0e4ff',
          muted:   '#6b7ab5',
          dim:     '#3a4070',
          success: '#00ff88',
          warning: '#ffaa00',
          danger:  '#ff3355',
        },
      },
      fontFamily: {
        koppa: ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'koppa-gradient': 'linear-gradient(135deg, #00d4ff 0%, #0066ff 50%, #8b2fff 100%)',
        'koppa-panel': 'linear-gradient(180deg, rgba(13,13,26,0.95) 0%, rgba(8,8,16,0.98) 100%)',
        'neon-glow': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'grid-pattern': 'linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'neon-sm': '0 0 8px rgba(0,212,255,0.4)',
        'neon':    '0 0 20px rgba(0,212,255,0.5)',
        'neon-lg': '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,212,255,0.2)',
        'panel':   '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-purple': '0 0 20px rgba(139,47,255,0.5)',
        'inner-neon': 'inset 0 1px 0 rgba(0,212,255,0.2)',
      },
      borderColor: {
        'neon': 'rgba(0,212,255,0.3)',
        'neon-bright': 'rgba(0,212,255,0.8)',
      },
      animation: {
        'pulse-neon':    'pulseNeon 2s ease-in-out infinite',
        'scan-line':     'scanLine 3s linear infinite',
        'float':         'float 4s ease-in-out infinite',
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'slide-down':    'slideDown 0.3s ease-out',
        'slide-left':    'slideLeft 0.3s ease-out',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'matrix':        'matrix 20s linear infinite',
        'boot-progress': 'bootProgress 2s ease-out forwards',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0,212,255,0.5)' },
          '50%':      { opacity: '0.7', boxShadow: '0 0 40px rgba(0,212,255,0.8)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 10px rgba(0,212,255,0.8)' },
          '50%':      { textShadow: '0 0 25px rgba(0,212,255,1), 0 0 50px rgba(0,212,255,0.5)' },
        },
        bootProgress: {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
