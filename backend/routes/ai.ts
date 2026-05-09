import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

const SYSTEM_PROMPT = `You are an intelligent writing assistant integrated into KOPPAWORD 2026, a professional document editor.
You help users with:
- Rewriting and improving text clarity and style
- Summarizing documents or paragraphs
- Translating text
- Fixing grammar and spelling
- Generating templates and boilerplate content
- Answering questions about document content
- Expanding brief ideas into detailed content
- Analyzing document structure and quality

Keep responses focused and useful. Format output as clean prose (not excessive markdown) unless the user asks for structured output.
When rewriting text, provide the improved version directly without meta-commentary.`

router.post('/chat', async (req: Request, res: Response) => {
  const { message, context, history = [], apiKey } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(400).json({
      error: 'No API key provided. Set ANTHROPIC_API_KEY environment variable or provide key in request.',
    })
  }

  try {
    const client = new Anthropic({ apiKey: key })

    // Build message history
    const messages: Anthropic.MessageParam[] = []

    // Add context as first system-style user message if available
    if (context && context.trim()) {
      messages.push({
        role: 'user',
        content: `[Document context (first ~2000 chars)]:\n${context}`,
      })
      messages.push({
        role: 'assistant',
        content: 'I have the document context. How can I help?',
      })
    }

    // Add conversation history
    for (const msg of history.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ response: text, usage: response.usage })
  } catch (err) {
    const error = err as Error & { status?: number }
    console.error('AI error:', error.message)
    res.status(error.status ?? 500).json({ error: error.message })
  }
})

// Grammar check endpoint
router.post('/grammar', async (req: Request, res: Response) => {
  const { text, apiKey } = req.body
  if (!text) return res.status(400).json({ error: 'Text required' })

  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(400).json({ error: 'No API key' })

  try {
    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Check the following text for grammar, spelling, and punctuation errors. Return a JSON object with:
{
  "issues": [{"type": "grammar|spelling|punctuation", "original": "...", "suggestion": "...", "explanation": "..."}],
  "score": 0-100,
  "summary": "brief feedback"
}

Text: "${text}"`,
      }],
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { issues: [], score: 100 }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Template generation
router.post('/template', async (req: Request, res: Response) => {
  const { type, description, apiKey } = req.body
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(400).json({ error: 'No API key' })

  try {
    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate a professional document template for: ${type}. ${description ? `Additional context: ${description}` : ''}
Return clean HTML content suitable for a rich text editor (use <h1>, <h2>, <p>, <ul>, <li> tags). Include placeholder text in brackets like [Company Name].`,
      }],
    })
    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ content })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Summarize
router.post('/summarize', async (req: Request, res: Response) => {
  const { text, length = 'medium', apiKey } = req.body
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(400).json({ error: 'No API key' })

  const lengthMap: Record<string, string> = {
    short: '1-2 sentences',
    medium: '1-2 paragraphs',
    long: '3-5 paragraphs',
  }

  try {
    const client = new Anthropic({ apiKey: key })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Summarize the following text in ${lengthMap[length] ?? '1-2 paragraphs'}:\n\n${text}`,
      }],
    })
    const summary = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
