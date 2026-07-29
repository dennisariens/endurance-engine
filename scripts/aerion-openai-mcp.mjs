#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = process.env.AERION_ROOT || path.resolve(__dirname, '..')
const MODEL = process.env.AERION_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini'

function respond(id, result) {
  if (id === undefined || id === null) return
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`)
}

function fail(id, code, message) {
  if (id === undefined || id === null) return
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`)
}

async function readJson(relativePath, fallback) {
  try {
    const file = path.join(ROOT, relativePath)
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function readEnvKey() {
  const candidates = [
    process.env.AERION_OPENAI_API_KEY,
    process.env.OPENAI_API_KEY,
  ].filter(Boolean)
  if (candidates[0]) return candidates[0]

  const envFiles = [
    path.join(ROOT, '.env.local'),
    path.join(ROOT, '.env'),
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

function formatMinutes(seconds) {
  if (!seconds) return 'n/a'
  const minutes = Math.round(seconds / 60)
  return minutes < 90 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim()
}

function nextRace(today, races) {
  return [...races].filter((race) => race.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
}

function latestActivities(activities, limit = 5) {
  return [...activities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((activity) => ({
      date: activity.date,
      name: activity.name,
      type: activity.type,
      duration: formatMinutes(activity.durationSec),
      distanceKm: activity.distanceM ? Number((activity.distanceM / 1000).toFixed(1)) : null,
      load: activity.load ?? null,
      raceCost: activity.raceCost ?? null,
      avgHr: activity.avgHr ?? null,
      source: activity.source,
    }))
}

async function buildContext({ date } = {}) {
  const state = await readJson('data/current-state.json', {})
  const activities = await readJson('data/activities.json', [])
  const races = await readJson('data/races.json', [])
  const goals = await readJson('data/goals.json', [])
  const today = date || state.last_updated || new Date().toISOString().slice(0, 10)
  const race = nextRace(today, races)
  const highCostActivities = activities.filter((activity) => (activity.raceCost ?? activity.load ?? 0) >= 70)
  const avgRaceCost = activities.length
    ? Math.round(activities.reduce((sum, activity) => sum + (activity.raceCost ?? activity.load ?? 0), 0) / activities.length)
    : 0

  return {
    generatedAt: new Date().toISOString(),
    source: 'aerion-local-mcp',
    date: today,
    root: ROOT,
    state: {
      recovery_status: state.recovery_status ?? 'unknown',
      injury_present: Boolean(state.injury_present),
      illness_present: Boolean(state.illness_present),
      next_race_name: state.next_race_name ?? race?.name ?? null,
      next_race_date: state.next_race_date ?? race?.date ?? null,
      days_until_next_race: state.days_until_next_race ?? null,
      latest_race_cost: state.latest_race_cost ?? null,
      latest_race_cost_band: state.latest_race_cost_band ?? null,
      resting_hr_14d_avg: state.resting_hr_14d_avg ?? null,
      hrv_14d_avg: state.hrv_14d_avg ?? null,
      sleep_hours_14d_avg: state.sleep_hours_14d_avg ?? null,
      garmin_training_readiness: state.garmin_training_readiness ?? null,
      recovery_time_hours: state.recovery_time_hours ?? null,
      training_status: state.training_status ?? null,
    },
    agenda: {
      nextRace: race ? {
        name: race.name,
        date: race.date,
        discipline: race.discipline,
        distanceKm: race.distanceKm ?? null,
        mandatory: Boolean(race.mandatory),
      } : null,
      racesLoaded: races.length,
      goalsLoaded: goals.length,
      activeGoal: goals[0]?.name ?? null,
    },
    history: {
      activitiesLoaded: activities.length,
      highCostActivities: highCostActivities.length,
      avgRaceCost,
      latestActivities: latestActivities(activities),
    },
    rules: [
      'Actual completed activities are authoritative.',
      'Fixed races remain fixed unless injury or illness is present.',
      'Recommendations are advisory, not restrictive.',
      'Predictions are ranges with confidence, never certainty.',
      'Explain consequences without scolding.',
    ],
  }
}

function contextToPrompt(context) {
  return `You are AERION, Dennis Ariens' local-first endurance control system. Use the local context below. Be concise, consequence-aware, and advisory. Never pretend missing Garmin/Strava/Intervals data is present.\n\nAERION context:\n${JSON.stringify(context, null, 2)}`
}

async function askOpenAI({ prompt, date, model = MODEL, max_output_tokens = 700 } = {}) {
  if (!prompt) throw new Error('prompt is required')
  const apiKey = await readEnvKey()
  if (!apiKey) {
    return {
      ok: false,
      message: 'No OpenAI API key found. Set AERION_OPENAI_API_KEY or OPENAI_API_KEY in /Users/dennisariens/.hermes/.env, the shell environment, or the project env file.',
    }
  }
  const context = await buildContext({ date })
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
    return { ok: false, status: response.status, message: payload.error?.message || 'OpenAI request failed' }
  }
  const text = payload.output_text
    || payload.output?.flatMap((item) => item.content || []).map((content) => content.text || '').join('\n').trim()
    || JSON.stringify(payload)
  return { ok: true, model, text, context }
}

const tools = [
  {
    name: 'get_aerion_context',
    description: 'Return local AERION endurance context: readiness, next race, recent activities, goals, and control rules.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'ISO date to anchor the context, e.g. 2026-04-30.' },
      },
    },
  },
  {
    name: 'ask_aerion_openai',
    description: 'Ask OpenAI for an AERION coaching/planning response using local AERION context. Requires AERION_OPENAI_API_KEY or OPENAI_API_KEY server-side.',
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
        serverInfo: { name: 'aerion-openai-mcp', version: '1.0.0' },
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
        ? await buildContext(args)
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
