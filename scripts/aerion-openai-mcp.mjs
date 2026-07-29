#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BASE_URL = (process.env.AERION_BASE_URL || 'http://127.0.0.1:5174').replace(/\/$/, '')
const MODEL = process.env.AERION_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini'

function respond(id, result) {
  if (id === undefined || id === null) return
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`)
}

function fail(id, code, message) {
  if (id === undefined || id === null) return
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`)
}

async function readEnvKey() {
  const candidates = [
    process.env.AERION_OPENAI_API_KEY,
    process.env.OPENAI_API_KEY,
  ].filter(Boolean)
  if (candidates[0]) return candidates[0]

  const root = process.env.AERION_ROOT || process.cwd()
  const envFiles = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
    path.join(process.env.HOME || '', '.hermes', '.env'),
  ]

  for (const file of envFiles) {
    if (!file || !existsSync(file)) continue
    try {
      const text = await readFile(file, 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*(AERION_OPENAI_API_KEY|OPENAI_API_KEY)\s*=\s*(.+?)\s*$/)
        if (!match) continue
        return match[2].replace(/^['"]|['"]$/g, '')
      }
    } catch {
      // Deliberately silent: never leak env file details over MCP.
    }
  }
  return ''
}

async function getAerionContext({ date } = {}) {
  const anchorDate = date || new Date().toISOString().slice(0, 10)
  const url = `${BASE_URL}/api/briefing?date=${encodeURIComponent(anchorDate)}`
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const text = await response.text()
    if (!response.ok) return { ok: false, source: 'aerion-local-api', url, message: `AERION briefing endpoint returned HTTP ${response.status}` }
    const payload = JSON.parse(text)
    return { ok: true, source: 'aerion-local-api', url, ...payload }
  } catch (error) {
    return {
      ok: false,
      source: 'aerion-local-api',
      url,
      message: `AERION local briefing service unavailable. Start AERION with npm run dev or open the desktop app. ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function contextToPrompt(context) {
  return `You are AERION, Dennis Ariens' local-first endurance control system. Use the shared local /api/briefing context below. Be concise, consequence-aware, and advisory. Never pretend missing Garmin/Strava/Intervals data is present.\n\nAERION context:\n${JSON.stringify(context, null, 2)}`
}

async function askOpenAI({ prompt, date, model = MODEL, max_output_tokens = 700 } = {}) {
  if (!prompt) throw new Error('prompt is required')
  const context = await getAerionContext({ date })
  if (!context.ok) return context

  const apiKey = await readEnvKey()
  if (!apiKey) {
    return {
      ok: false,
      message: 'No OpenAI API key found. Set AERION_OPENAI_API_KEY or OPENAI_API_KEY in server-side environment or local env file.',
      context,
    }
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_output_tokens,
      input: [
        { role: 'system', content: contextToPrompt(context) },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { ok: false, status: response.status, message: payload.error?.message || 'OpenAI request failed', context }
  }
  const text = payload.output_text
    || payload.output?.flatMap((item) => item.content || []).map((content) => content.text || '').join('\n').trim()
    || JSON.stringify(payload)
  return { ok: true, model, text, context }
}

const tools = [
  {
    name: 'get_aerion_context',
    description: 'Return shared local AERION briefing context from /api/briefing: readiness, next race, recent activities, goals, and control rules.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'ISO date to anchor the context, e.g. 2026-04-30.' },
      },
    },
  },
  {
    name: 'ask_aerion_openai',
    description: 'Ask OpenAI for an AERION coaching/planning response using the shared local /api/briefing context. Requires AERION_OPENAI_API_KEY or OPENAI_API_KEY server-side.',
    inputSchema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', description: 'Question or task for the OpenAI-backed AERION coach.' },
        date: { type: 'string', description: 'Optional ISO date to anchor the context.' },
        model: { type: 'string', description: 'Optional OpenAI model override.' },
        max_output_tokens: { type: 'number', description: 'Maximum output tokens. Default 700.' },
      },
    },
  },
]

async function handle(message) {
  const { id, method, params } = message
  try {
    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'aerion-openai-mcp', version: '1.1.0' },
      })
      return
    }
    if (method === 'notifications/initialized') return
    if (method === 'tools/list') {
      respond(id, { tools })
      return
    }
    if (method === 'tools/call') {
      const name = params?.name
      const args = params?.arguments || {}
      const result = name === 'get_aerion_context'
        ? await getAerionContext(args)
        : name === 'ask_aerion_openai'
          ? await askOpenAI(args)
          : null
      if (!result) {
        fail(id, -32601, `Unknown tool: ${name}`)
        return
      }
      respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
      return
    }
    fail(id, -32601, `Unknown method: ${method}`)
  } catch (error) {
    fail(id, -32000, error instanceof Error ? error.message : String(error))
  }
}

let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      void handle(JSON.parse(line))
    } catch (error) {
      fail(null, -32700, error instanceof Error ? error.message : String(error))
    }
  }
})
