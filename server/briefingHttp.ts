import type { IncomingMessage, ServerResponse } from 'node:http'
import { Buffer } from 'node:buffer'
import { buildBriefingPayload, type BuildBriefingPayloadOptions } from './aerionApi'
import { validateStateSnapshot } from '../src/data/backupSnapshot'

const MAX_BODY_BYTES = 2_000_000
const snapshotSchema = {
  type: 'object', required: ['activities', 'races', 'goals', 'state'],
  properties: {
    date: { type: 'string', format: 'date' },
    activities: { type: 'array', items: { type: 'object', required: ['id', 'date', 'name', 'type', 'source'] } },
    races: { type: 'array', items: { type: 'object', required: ['id', 'date', 'name', 'discipline', 'priority', 'mandatory'] } },
    goals: { type: 'array', items: { type: 'object', required: ['id', 'name', 'type', 'discipline', 'status'] } },
    state: { type: 'object', required: ['injury_present', 'illness_present', 'recovery_status'], properties: { injury_present: { type: 'boolean' }, illness_present: { type: 'boolean' }, recovery_status: { enum: ['unknown', 'green', 'yellow', 'red'] } } },
    decisionLog: { type: 'array', items: { type: 'object' } }, activeGoalId: { type: 'string' }, syncedAt: { type: 'string', format: 'date-time' },
  },
}
const migration = { method: 'POST', path: '/api/briefing', schema: snapshotSchema, instructions: 'POST the current browser snapshot as JSON. CLI/MCP: explicitly set AERION_SNAPSHOT_PATH or use --snapshot FILE. No server snapshot is retained.' }
class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message) }
}
function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
function sameOrigin(req: IncomingMessage) {
  // CLI clients omit Origin. Never trust forwarding headers to establish scheme.
  if (req.headers.origin === undefined) return true
  try {
    const scheme = (req.socket as { encrypted?: boolean }).encrypted ? 'https:' : 'http:'
    const host = req.headers.host
    if (!host || !/^[a-zA-Z0-9.\-\[\]:]+$/.test(host)) return false
    const expected = new URL(`${scheme}//${host}`)
    const origin = new URL(req.headers.origin)
    return ['http:', 'https:'].includes(origin.protocol) && !origin.username && !origin.password && req.headers.origin === origin.origin && origin.origin === expected.origin
  } catch { return false }
}
function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let bytes = 0
    let chunks: Buffer[] = []
    let rejected = false
    req.on('data', (chunk: Buffer) => {
      if (rejected) return // Drain, without retaining oversized input or destroying the response socket.
      bytes += chunk.length
      if (bytes > limit) { rejected = true; chunks = []; reject(new HttpError(413, 'SNAPSHOT_TOO_LARGE', 'Snapshot exceeds the request size limit.')); return }
      chunks.push(chunk)
    })
    req.on('end', () => { if (!rejected) resolve(Buffer.concat(chunks).toString('utf8')) })
    req.on('error', () => reject(new HttpError(400, 'INVALID_SNAPSHOT', 'Unable to read snapshot.')))
    req.on('aborted', () => reject(new HttpError(400, 'INVALID_SNAPSHOT', 'Unable to read snapshot.')))
  })
}
function validateInput(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid snapshot')
  const row = input as Record<string, unknown>
  // Reuse the backup boundary's complete record/enum/metric/date validation;
  // API snapshots do not contain UI settings or blocked dates.
  validateStateSnapshot({ theme: 'dark', blockedDates: [], activities: row.activities, races: row.races, goals: row.goals, currentState: row.state, decisionLog: row.decisionLog === undefined ? [] : row.decisionLog, activeGoalId: row.activeGoalId })
  if (row.syncedAt !== undefined && (typeof row.syncedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.syncedAt) || !validDay(row.syncedAt.slice(0, 10)) || !Number.isFinite(Date.parse(row.syncedAt)))) throw new Error('Invalid snapshot')
  // Allowlist input fields: never forward transport fields, env or persistence options.
  return { activities: row.activities, races: row.races, goals: row.goals, state: row.state, decisionLog: row.decisionLog, activeGoalId: row.activeGoalId, syncedAt: row.syncedAt } as NonNullable<BuildBriefingPayloadOptions['snapshot']>
}

export function createBriefingHandler({ maxBodyBytes = MAX_BODY_BYTES, buildPayload = buildBriefingPayload }: { maxBodyBytes?: number; buildPayload?: typeof buildBriefingPayload } = {}) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (status: number, payload: unknown) => { res.statusCode = status; res.end(JSON.stringify(payload)) }
    try {
      if (req.method === 'GET') {
        res.setHeader('Deprecation', 'true')
        res.setHeader('Link', '</api/briefing>; rel="successor-version"')
        send(409, { ok: false, source: 'unavailable', code: 'BROWSER_SNAPSHOT_REQUIRED', message: 'A browser coaching snapshot is required. Use the in-app coach or explicitly supply a snapshot file; no fixture fallback.', migration }); return
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.') }
      if (!sameOrigin(req)) throw new HttpError(403, 'SAME_ORIGIN_REQUIRED', 'Same-origin snapshot required.')
      if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'JSON_REQUIRED', 'Content-Type application/json is required.')
      const text = await readBody(req, maxBodyBytes)
      let input: Record<string, unknown>, snapshot: NonNullable<BuildBriefingPayloadOptions['snapshot']>
      try { input = JSON.parse(text); snapshot = validateInput(input) } catch { throw new HttpError(400, 'INVALID_SNAPSHOT', 'Invalid coaching snapshot JSON or records.') }
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const date = input.date ?? url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
      if (!validDay(date)) throw new HttpError(400, 'INVALID_DATE', 'A valid ISO calendar date is required.')
      // No env, database path, retained snapshots or provider fetches at this boundary.
      const payload = await buildPayload({ env: {}, date, snapshot })
      if (!payload.ok) {
        const suppliedCode = 'code' in payload ? payload.code : undefined
        const code = typeof suppliedCode === 'string' && ['COACHING_EVIDENCE_MISSING', 'COACHING_EVIDENCE_STALE', 'COACHING_EVIDENCE_CONFLICTING'].includes(suppliedCode) ? suppliedCode : 'SNAPSHOT_CONFLICT'
        res.setHeader('X-AERION-Evidence', code)
        send(409, { ok: false, source: 'unavailable', code, message: 'Refresh or resolve browser recovery evidence before requesting a personalised briefing.' }); return
      }
      send(200, payload)
    } catch (error) {
      if (error instanceof HttpError) send(error.status, { ok: false, code: error.code, message: error.message })
      else send(500, { ok: false, code: 'BRIEFING_UNAVAILABLE', message: 'Unable to generate briefing from supplied snapshot.' })
    }
  }
}
