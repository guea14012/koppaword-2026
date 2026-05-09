import express from 'express'
import cors from 'cors'
import documentsRouter from './routes/documents'
import aiRouter from './routes/ai'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.use(cors({ origin: ['http://localhost:5173', 'file://'] }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  version: '1.0.0',
  app: 'KOPPAWORD 2026 Backend',
  timestamp: new Date().toISOString(),
}))

app.use('/api/documents', documentsRouter)
app.use('/api/ai', aiRouter)

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[KOPPAWORD]', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`\n  ╔═══════════════════════════════════╗`)
  console.log(`  ║   KOPPAWORD 2026 Backend v1.0     ║`)
  console.log(`  ║   Running on http://localhost:${PORT}  ║`)
  console.log(`  ╚═══════════════════════════════════╝\n`)
})

export default app
