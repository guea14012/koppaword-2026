import Database from 'better-sqlite3'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'
import os from 'os'

const DB_DIR = path.join(os.homedir(), '.koppaword')
const DB_PATH = path.join(DB_DIR, 'documents.db')

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    content     TEXT NOT NULL DEFAULT '',
    file_path   TEXT,
    word_count  INTEGER DEFAULT 0,
    char_count  INTEGER DEFAULT 0,
    encrypted   INTEGER DEFAULT 0,
    language    TEXT DEFAULT 'en',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_versions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    word_count  INTEGER DEFAULT 0,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'General',
    content     TEXT NOT NULL,
    thumbnail   TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_versions_doc ON document_versions(document_id, created_at DESC);
`)

export default db
