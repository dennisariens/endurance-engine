import { open } from 'node:fs/promises'

const MAX_BYTES = 2_000_000
const unavailable = (code, message, status) => ({ ok: false, source: 'aerion-local-api', code, message, ...(status ? { status } : {}) })
export function snapshotPathFromArgs(args = process.argv.slice(2), env = process.env) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--snapshot' || args[i].startsWith('--snapshot=')) {
      const value = args[i] === '--snapshot' ? args[i + 1] : args[i].slice('--snapshot='.length)
      if (!value || value.startsWith('--')) throw new Error('--snapshot requires a file.')
      return value
    }
  }
  return env.AERION_SNAPSHOT_PATH || undefined
}
async function readSnapshot(file) {
  const handle = await open(file, 'r')
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Invalid file')
    // Bound the read itself too, including files replaced/grown since stat.
    const buffer = Buffer.alloc(MAX_BYTES + 1)
    let size = 0
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(buffer, size, buffer.length - size, null)
      if (bytesRead === 0) break
      size += bytesRead
    }
    if (size > MAX_BYTES) throw new Error('Invalid file')
    const input = JSON.parse(buffer.subarray(0, size).toString('utf8'))
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid file')
    // Accept an API snapshot or an explicitly selected browser backup export.
    // Do not send unrelated account/UI metadata or transport/persistence settings.
    const { activities, races, goals, decisionLog, activeGoalId, syncedAt } = input
    return { activities, races, goals, state: input.state ?? input.currentState, decisionLog, activeGoalId, syncedAt }
  } finally { await handle.close() }
}
export async function fetchBriefing({ baseUrl = process.env.AERION_BASE_URL || 'http://127.0.0.1:5174', date = new Date().toISOString().slice(0, 10), snapshotPath } = {}) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return unavailable('INVALID_DATE', 'A valid ISO calendar date is required.')
  let url
  try {
    const base = new URL(baseUrl)
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid endpoint')
    url = new URL('/api/briefing', base)
  } catch { return unavailable('INVALID_ENDPOINT', 'AERION_BASE_URL must be an HTTP(S) endpoint without credentials, query or fragment.') }
  let body
  if (snapshotPath) {
    try {
      body = JSON.stringify({ ...await readSnapshot(snapshotPath), date })
      if (Buffer.byteLength(body) > MAX_BYTES) throw new Error('Invalid file')
    } catch { return unavailable('INVALID_SNAPSHOT_FILE', 'Unable to read a valid snapshot file within the size limit. Select a current browser snapshot with --snapshot FILE or AERION_SNAPSHOT_PATH.') }
  }
  try {
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET', redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body } : {}),
    })
    // Never echo an error body, URL, local path or raw fetch error to CLI/MCP.
    if (!response.ok) {
      await response.body?.cancel()
      if (response.status === 409 && !body) return unavailable('BROWSER_SNAPSHOT_REQUIRED', 'A browser coaching snapshot is required. Use the in-app coach or explicitly select --snapshot FILE / AERION_SNAPSHOT_PATH. The client POSTs snapshots to /api/briefing; no server snapshot is retained.', 409)
      const evidence = response.headers.get('x-aerion-evidence')
      if (response.status === 409 && ['COACHING_EVIDENCE_MISSING', 'COACHING_EVIDENCE_STALE', 'COACHING_EVIDENCE_CONFLICTING'].includes(evidence)) return unavailable(evidence, 'Refresh or resolve browser recovery evidence, then explicitly supply the updated snapshot.', 409)
      return unavailable('BRIEFING_UNAVAILABLE', 'AERION could not generate a briefing. Check the supplied browser snapshot and local service.', response.status)
    }
    const payload = await response.json()
    if (payload?.ok !== true) return unavailable('BRIEFING_UNAVAILABLE', 'AERION returned an unavailable briefing.')
    return { ...payload, source: payload.source || 'aerion-local-api' }
  } catch { return unavailable('BRIEFING_UNAVAILABLE', 'AERION local briefing service unavailable. Start AERION and explicitly supply a current browser snapshot.') }
}
