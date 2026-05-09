import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete: () => void
}

const STEPS = [
  'Initializing core engine...',
  'Loading AI modules...',
  'Configuring document engine...',
  'Preparing workspace...',
  'Ready.',
]

export default function SplashScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const totalMs = 2400
    const interval = 40
    const steps = totalMs / interval
    let count = 0

    const timer = setInterval(() => {
      count++
      const pct = Math.min(100, Math.round((count / steps) * 100))
      setProgress(pct)
      setStep(Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length)))
      if (pct >= 100) {
        clearInterval(timer)
        setTimeout(() => {
          setVisible(false)
          setTimeout(onComplete, 500)
        }, 300)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-koppa-void overflow-hidden"
        >
          {/* Grid background */}
          <div className="absolute inset-0 splash-grid opacity-60" />

          {/* Radial glow */}
          <div className="absolute inset-0 bg-neon-glow opacity-40 pointer-events-none" />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-koppa-neon to-transparent opacity-30"
            animate={{ y: ['-100vh', '100vh'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />

          {/* Corner decorations */}
          {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
            <motion.div
              key={i}
              className={`absolute ${pos} w-8 h-8 border-koppa-neon`}
              style={{
                borderTopWidth: i < 2 ? 2 : 0,
                borderBottomWidth: i >= 2 ? 2 : 0,
                borderLeftWidth: i % 2 === 0 ? 2 : 0,
                borderRightWidth: i % 2 !== 0 ? 2 : 0,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-12 text-center"
          >
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl opacity-20"
              style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* KOPPAWORD mark */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                {/* K icon */}
                <motion.div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold font-display"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))',
                    border: '2px solid rgba(0,212,255,0.6)',
                    boxShadow: '0 0 30px rgba(0,212,255,0.4), inset 0 0 20px rgba(0,212,255,0.1)',
                    color: '#00d4ff',
                  }}
                  animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.4)', '0 0 50px rgba(0,212,255,0.7)', '0 0 20px rgba(0,212,255,0.4)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  K
                </motion.div>

                <div className="text-left">
                  <motion.h1
                    className="text-4xl font-bold font-display tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, #00d4ff, #0066ff, #8b2fff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                    animate={{
                      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    KOPPAWORD
                  </motion.h1>
                  <div className="text-koppa-neon text-sm font-mono tracking-[0.3em] opacity-80">
                    2026 EDITION
                  </div>
                </div>
              </div>

              <p className="text-koppa-muted text-sm tracking-widest mt-2">
                PROFESSIONAL DOCUMENT INTELLIGENCE
              </p>
            </div>
          </motion.div>

          {/* Progress section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-80"
          >
            {/* Status text */}
            <div className="text-koppa-muted text-xs font-mono mb-3 text-center tracking-widest h-4">
              {STEPS[step]}
            </div>

            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #0066ff, #00d4ff)',
                  boxShadow: '0 0 12px rgba(0,212,255,0.6)',
                }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>

            <div className="flex justify-between mt-2 text-koppa-dim text-xs font-mono">
              <span>INITIALIZING</span>
              <span>{progress}%</span>
            </div>
          </motion.div>

          {/* Version badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 text-koppa-dim text-xs font-mono tracking-widest"
          >
            v1.0.0 · KoppaZZZ · 2026
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
