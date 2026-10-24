import { createServer, request as httpRequest } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createBriefingHandler } from './briefingHttp'

const snapshot = () => ({ date: '2026-10-17', activities: [{ id: 'synthetic', date: '2026-10-16', name: 'Synthetic ride', type: 'Ride', source: 'manual', durationSec: 600 }], races: [], goals: [], state: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 70, last_updated: '2026-10-17' } })
const servers: ReturnType<typeof createServer>[] = []
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) }))) })
async function service(options = {}) {
  const server = createServer(createBriefingHandler(options)); servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  const base = `http://127.0.0.1:${address.port}`
  return { base, send: (body: unknown = snapshot(), headers = {}, method = 'POST', path = '/api/briefing') => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) }) }
}

describe('briefing HTTP boundary (real loopback HTTP; synthetic records)', () => {
  it('keeps GET fail-closed with stable migration metadata and privacy headers', async () => {
    const { send } = await service()
    const response = await send(undefined, {}, 'GET')
    expect(response.status).toBe(409)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('deprecation')).toBe('true')
    const body = await response.json()
    expect(body.code).toBe('BROWSER_SNAPSHOT_REQUIRED')
    expect(body.migration).toMatchObject({ method: 'POST', path: '/api/briefing', schema: { type: 'object', required: ['activities', 'races', 'goals', 'state'] } })
    expect(JSON.stringify(body)).not.toContain('Synthetic ride')
  })
  it('returns explicit unavailable without default prescriptions for a snapshot lacking readiness', async () => {
    const { send } = await service()
    const response = await send({ ...snapshot(), state: { injury_present: false, illness_present: false, recovery_status: 'unknown' } })
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe('COACHING_EVIDENCE_MISSING')
    expect(body).not.toHaveProperty('briefing')
    expect(body).not.toHaveProperty('control')
  })
  it('accepts explicit snapshots but never reuses them for GET or a later empty POST', async () => {
    const { send } = await service()
    const response = await send()
    expect(response.status).toBe(200)
    expect((await response.json()).source).toBe('browser-local')
    expect((await send(undefined, {}, 'GET')).status).toBe(409)
    expect((await send({})).status).toBe(400)
  })
  it.each([
    null, [], { ...snapshot(), activities: [null] },
    { ...snapshot(), activities: [{ ...snapshot().activities[0], source: 'invalid' }] },
    { ...snapshot(), activities: [{ ...snapshot().activities[0], durationSec: '600' }] },
    { ...snapshot(), activities: [{ ...snapshot().activities[0], load: -1 }] },
    { ...snapshot(), activities: [{ ...snapshot().activities[0], date: '2026-02-30' }] },
    { ...snapshot(), races: [{ id: 'r', date: '2026-10-20', name: 'r', discipline: 'invalid', priority: 'fixed', mandatory: true }] },
    { ...snapshot(), goals: [{ id: 'g', name: 'g', type: 'invalid', discipline: 'running', status: 'committed' }] },
    { ...snapshot(), decisionLog: null },
    { ...snapshot(), decisionLog: [{ id: 'd', date: '2026-10-17' }] },
    { ...snapshot(), state: { ...snapshot().state, sleep_score: 'bad' } },
    { ...snapshot(), state: { ...snapshot().state, field_evidence: { sleep_score: { source: 'bad', quality: 'reported' } } } },
    { ...snapshot(), activeGoalId: 'nonexistent' },
    { ...snapshot(), syncedAt: 'bad' },
    { ...snapshot(), date: '2026-02-30' },
  ])('rejects malformed snapshot without echoing supplied records %#', async body => {
    const { send } = await service()
    const response = await send(body)
    expect(response.status).toBe(400)
    expect(await response.text()).not.toContain('Synthetic')
  })
  it.each(['https://example.invalid', 'https://127.0.0.1', 'null', 'not an origin', 'http://user:pass@127.0.0.1', 'http://127.0.0.1/path'])('rejects cross-site or malformed Origin %s', async origin => {
    const { send } = await service()
    const response = await send(undefined, { Origin: origin })
    expect(response.status).toBe(403)
    expect(await response.text()).not.toContain(origin)
  })
  it('requires the same scheme as well as host, rejects origin paths and credentials, accepts exact origin', async () => {
    const { send, base } = await service()
    expect((await send(undefined, { Origin: base })).status).toBe(200)
    for (const origin of [base.replace('http:', 'https:'), base + '/', base.replace('http://', 'http://u:p@')]) expect((await send(undefined, { Origin: origin })).status).toBe(403)
  })
  it('bounds streamed bytes, rejects invalid JSON/content types and unsupported methods safely', async () => {
    const { send, base } = await service({ maxBodyBytes: 512 })
    expect((await send('x'.repeat(513))).status).toBe(413)
    const streamedStatus = await new Promise<number>((resolve, reject) => {
      const req = httpRequest(base + '/api/briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => { res.resume(); resolve(res.statusCode!) })
      req.on('error', reject); req.write('x'.repeat(300)); req.end('x'.repeat(300))
    })
    expect(streamedStatus).toBe(413)
    expect((await send('{private-token')).status).toBe(400)
    expect((await send(undefined, { 'Content-Type': 'text/plain' })).status).toBe(415)
    const response = await send(undefined, {}, 'PUT')
    expect(response.status).toBe(405); expect(response.headers.get('allow')).toBe('GET, POST')
  })
  it('sanitizes internal failures', async () => {
    const { send } = await service({ buildPayload: async () => { throw new Error('private-token /secret/path') } })
    const response = await send()
    expect(response.status).toBe(500)
    expect(await response.text()).not.toMatch(/private-token|secret/)
  })
})
