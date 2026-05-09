import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database'

const router = Router()

// List all documents
router.get('/', (req: Request, res: Response) => {
  try {
    const docs = db.prepare(`
      SELECT id, title, file_path, word_count, char_count, language, created_at, updated_at
      FROM documents ORDER BY updated_at DESC LIMIT 100
    `).all()
    res.json({ documents: docs })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Get single document
router.get('/:id', (req: Request, res: Response) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ document: doc })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Create document
router.post('/', (req: Request, res: Response) => {
  try {
    const { title = 'Untitled', content = '', file_path, language = 'en' } = req.body
    const id = uuidv4()
    const now = Date.now()
    const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
    const charCount = content.replace(/<[^>]*>/g, '').length

    db.prepare(`
      INSERT INTO documents (id, title, content, file_path, word_count, char_count, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content, file_path ?? null, wordCount, charCount, language, now, now)

    res.status(201).json({ id, created_at: now })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Update document
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { title, content, file_path, language } = req.body
    const now = Date.now()
    const wordCount = (content ?? '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
    const charCount = (content ?? '').replace(/<[^>]*>/g, '').length

    // Save version snapshot (every 5 minutes is handled client-side)
    if (content) {
      db.prepare(`
        INSERT INTO document_versions (document_id, content, word_count, created_at) VALUES (?, ?, ?, ?)
      `).run(req.params.id, content, wordCount, now)
      // Keep only last 50 versions
      db.prepare(`
        DELETE FROM document_versions WHERE document_id = ? AND id NOT IN (
          SELECT id FROM document_versions WHERE document_id = ? ORDER BY created_at DESC LIMIT 50
        )
      `).run(req.params.id, req.params.id)
    }

    db.prepare(`
      UPDATE documents SET title=COALESCE(?,title), content=COALESCE(?,content),
      file_path=COALESCE(?,file_path), word_count=?, char_count=?,
      language=COALESCE(?,language), updated_at=? WHERE id=?
    `).run(title ?? null, content ?? null, file_path ?? null, wordCount, charCount, language ?? null, now, req.params.id)

    res.json({ updated_at: now })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Delete document
router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id)
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Get version history
router.get('/:id/versions', (req: Request, res: Response) => {
  try {
    const versions = db.prepare(`
      SELECT id, word_count, created_at FROM document_versions
      WHERE document_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(req.params.id)
    res.json({ versions })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
