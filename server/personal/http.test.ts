import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createApp, loadConfig } from './http'

const snapshot = () => ({ theme: 'dark', races: [], goals: [], activities: [], blockedDates: [], decisionLog: [], currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown', field_evidence: { recovery_score: { source: 'manual', quality: 'reported', observedAt: '2026-10-01' } } } })
const servers: Server[] = []
let passwordHash: string
beforeAll(async () => { passwordHash = await bcrypt.hash('synthetic-test-password', 10) })
afterEach(async () => { await Promise.all(servers.splice(0).map(s => new Promise<void>(resolve => { s.closeAllConnections(); s.close(() => resolve()) }))) })
function memoryStore() {
  const sessions = new Map<string, any>()
  let envelope: any = { revision: 0, snapshot: null, updatedAt: null }
  const writes = new Map<string, any>()
  return {
    sessions,
    async createSession(s: any) { sessions.set(s.tokenHash, s) },
    async getSession(hash: string) { const s = sessions.get(hash); return s && new Date(s.expiresAt).getTime() > Date.now() ? s : null },
    async deleteSession(hash: string) { sessions.delete(hash) },
    async getState() { return envelope },
    async saveState(v: any) {
      const payload = JSON.stringify({ revision: v.revision, snapshot: v.snapshot })
      if (writes.has(v.key)) { const prior = writes.get(v.key); if (prior.payload !== payload) throw Object.assign(new Error('conflict'), { status: 409 }); return prior.envelope }
      if (v.revision !== envelope.revision) throw Object.assign(new Error('conflict'), { status: 409 })
      envelope = { revision: envelope.revision + 1, snapshot: v.snapshot, updatedAt: new Date().toISOString() }
      writes.set(v.key, { payload, envelope }); return envelope
    },
  }
}
async function fixture(options: any = {}) {
  const store = options.store ?? memoryStore()
  const config = loadConfig({ NODE_ENV: 'test', AERION_ORIGIN: 'https://aerion.example', AERION_OWNER_ID: randomUUID(), AERION_OWNER_DISPLAY_NAME: 'Synthetic owner', AERION_PASSWORD_HASH: passwordHash, DATABASE_URL: 'postgresql://localhost/aerion_test', AERION_TRUST_PROXY: 'loopback' })
  const server = createServer(createApp({ config, store, ...options })); servers.push(server)
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${(server.address() as any).port}`
  async function request(path: string, method = 'GET', body?: any, headers: any = {}) {
    return new Promise<Response>((resolve, reject) => {
      const req = httpRequest(base + path, { method, headers: { host: 'aerion.example', 'x-forwarded-proto': 'https', ...(method === 'GET' ? {} : { origin: 'https://aerion.example', 'content-type': 'application/json' }), ...headers } }, res => {
        const chunks: Buffer[] = []; res.on('data', c => chunks.push(c)); res.on('end', () => {
          const responseHeaders = new Headers()
          for (const [key, value] of Object.entries(res.headers)) if (value !== undefined) for (const item of Array.isArray(value) ? value : [value]) responseHeaders.append(key, item)
          resolve(new Response(res.statusCode === 204 ? null : Buffer.concat(chunks), { status: res.statusCode, headers: responseHeaders }))
        })
      }); req.on('error', reject); if (body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body)); req.end()
    })
  }
  async function login() {
    const challenge = await request('/api/auth/session'); const anonymous = challenge.headers.get('set-cookie')!.split(';')[0]
    const csrf = (await challenge.json()).csrfToken
    const response = await request('/api/auth/login', 'POST', { password: 'synthetic-test-password' }, { cookie: anonymous, 'x-csrf-token': csrf })
    expect(response.status).toBe(204)
    const cookie = response.headers.get('set-cookie')!.split(';')[0]
    const session = await request('/api/auth/session', 'GET', undefined, { cookie })
    return { cookie, 'x-csrf-token': (await session.json()).csrfToken }
  }
  return { request, login, store }
}

describe('Personal Sync security and client HTTP contract', () => {
  it('fails closed on missing or unsafe production configuration', () => {
    expect(() => loadConfig({})).toThrow()
    expect(() => loadConfig({ AERION_ORIGIN: 'http://example.com' })).toThrow()
  })
  it('issues anonymous CSRF but denies canonical reads and writes without authentication', async () => {
    const { request } = await fixture()
    const response = await request('/api/auth/session')
    expect(await response.json()).toMatchObject({ authenticated: false, csrfToken: expect.any(String) })
    expect(response.headers.get('set-cookie')).toMatch(/__Host-aerion=.*HttpOnly.*Secure.*SameSite=Strict/)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect((await request('/api/state')).status).toBe(401)
    expect((await request('/api/state', 'PUT', { snapshot: snapshot() })).status).toBe(401)
    expect((await request('/api/sync', 'POST', {})).status).toBe(401)
  })
  it('rejects wrong host, insecure forwarded transport, forged forwarded host, foreign origin and cross-site reads', async () => {
    const { request } = await fixture()
    for (const headers of [{ host: 'evil.example' }, { 'x-forwarded-proto': 'http' }, { 'x-forwarded-host': 'evil.example' }, { origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }]) {
      expect((await request('/api/auth/session', 'GET', undefined, headers)).status).toBe(403)
    }
  })
  it('requires anonymous CSRF for login and rotates sessions on authentication', async () => {
    const { request, login, store } = await fixture()
    expect((await request('/api/auth/login', 'POST', { password: 'synthetic-test-password' })).status).toBe(403)
    const headers = await login()
    expect(store.sessions.size).toBe(1)
    const result = await request('/api/auth/session', 'GET', undefined, headers)
    expect(await result.json()).toMatchObject({ authenticated: true, owner: { displayName: 'Synthetic owner' } })
    expect(await (await request('/api/state', 'GET', undefined, headers)).json()).toEqual({ revision: 0, snapshot: null, updatedAt: null })
  })
  it('returns bounded generic errors for incorrect passwords and rate limits login attempts', async () => {
    const { request } = await fixture({ loginLimit: 2 })
    const challenge = await request('/api/auth/session'); const cookie = challenge.headers.get('set-cookie')!.split(';')[0]
    const headers = { cookie, 'x-csrf-token': (await challenge.json()).csrfToken }
    expect((await request('/api/auth/login', 'POST', { password: 'wrong' }, headers)).status).toBe(401)
    expect((await request('/api/auth/login', 'POST', { password: 'wrong' }, headers)).status).toBe(401)
    const blocked = await request('/api/auth/login', 'POST', { password: 'wrong' }, headers)
    expect(blocked.status).toBe(429); expect((await blocked.text()).length).toBeLessThan(200)
  })
  it('saves validated state, preserves observedAt, handles retries and conflicts across two sessions', async () => {
    const { request, login } = await fixture(); const mac = await login(); const phone = await login()
    const candidate = snapshot(); const headers = { ...mac, 'if-match': '"0"', 'idempotency-key': randomUUID() }
    const response = await request('/api/state', 'PUT', { snapshot: candidate }, headers)
    expect(response.status).toBe(200); const saved = await response.json()
    expect(saved.revision).toBe(1); expect(saved.snapshot.currentState.field_evidence.recovery_score.observedAt).toBe('2026-10-01')
    expect(await (await request('/api/state', 'PUT', { snapshot: candidate }, headers)).json()).toEqual(saved)
    expect(await (await request('/api/state', 'GET', undefined, phone)).json()).toEqual(saved)
    expect((await request('/api/state', 'PUT', { snapshot: { ...candidate, theme: 'light' } }, headers)).status).toBe(409)
    expect((await request('/api/state', 'PUT', { snapshot: candidate }, { ...phone, 'if-match': '"0"', 'idempotency-key': randomUUID() })).status).toBe(409)
  })
  it('rejects malformed snapshots, ambiguous duplicate activity candidates and missing preconditions', async () => {
    const { request, login } = await fixture(); const session = await login()
    const headers = { ...session, 'if-match': '"0"', 'idempotency-key': randomUUID() }
    expect((await request('/api/state', 'PUT', { snapshot: { privateMarker: 'never-echo-this' } }, headers)).status).toBe(400)
    expect((await request('/api/state', 'PUT', { snapshot: snapshot() }, session)).status).toBe(428)
    const activity = { id: 'a', date: '2026-10-01', name: 'Synthetic', type: 'Ride', source: 'manual', durationSec: 600 }
    const duplicate = await request('/api/state', 'PUT', { snapshot: { ...snapshot(), activities: [activity, { ...activity, id: 'b' }] } }, headers)
    expect(duplicate.status).toBe(409); expect(await duplicate.json()).toEqual({ error: 'ACTIVITY_REVIEW_REQUIRED' })
    const csrf = await request('/api/state', 'PUT', { snapshot: snapshot() }, { ...headers, 'x-csrf-token': 'wrong' })
    expect(csrf.status).toBe(403); expect(await csrf.json()).toEqual({ error: 'CSRF_REQUIRED' })
  })
  it('invalidates logout and expired sessions without disclosing athlete state', async () => {
    const { request, login, store } = await fixture(); const session = await login()
    expect((await request('/api/auth/logout', 'POST', {}, session)).status).toBe(204)
    expect((await request('/api/state', 'GET', undefined, session)).status).toBe(401)
    const expired = await login(); for (const row of store.sessions.values()) row.expiresAt = new Date(0)
    expect((await request('/api/state', 'GET', undefined, expired)).status).toBe(401)
  })
  it('never fabricates provider sync; enforces JSON bounds and no legacy unauthenticated routes', async () => {
    const { request, login } = await fixture(); const session = await login()
    const unavailable = await request('/api/sync', 'POST', {}, { ...session, 'idempotency-key': randomUUID() })
    expect(unavailable.status).toBe(503); expect(await unavailable.json()).toEqual({ error: 'PROVIDER_UNAVAILABLE' })
    expect((await request('/api/state', 'PUT', '{invalid', session)).status).toBe(400)
    expect((await request('/api/state', 'PUT', 'x'.repeat(5 * 1024 * 1024 + 1), session)).status).toBe(413)
    expect((await request('/api/briefing')).status).toBe(401)
    expect((await request('/api/briefing', 'GET', undefined, session)).status).toBe(404)
  })
  it.each([
    [503, '08006', 503, 'PERSISTENCE_UNAVAILABLE'],
    [409, '23505', 409, 'REVISION_CONFLICT'],
    [400, 'INJECTED_PRIVATE_CODE', 400, 'INVALID_REQUEST'],
    [403, 'ACTIVITY_REVIEW_REQUIRED', 403, 'INVALID_REQUEST'],
    [500, 'CSRF_REQUIRED', 500, 'INTERNAL_ERROR'],
  ])('sanitizes store errors with status %s and code %s', async (status, code, expectedStatus, expectedCode) => {
    const store = memoryStore()
    store.getState = async () => { throw Object.assign(new Error('private SQL and user payload'), { status, code }) }
    const { request, login } = await fixture({ store }); const session = await login()
    const response = await request('/api/state', 'GET', undefined, session)
    expect(response.status).toBe(expectedStatus)
    expect(await response.json()).toEqual({ error: expectedCode })
  })
  it('preserves CSRF application error codes', async () => {
    const { request } = await fixture()
    const response = await request('/api/auth/login', 'POST', { password: 'synthetic-test-password' })
    expect(response.status).toBe(403); expect(await response.json()).toEqual({ error: 'CSRF_REQUIRED' })
  })
  it('preserves invalid snapshot application error codes', async () => {
    const { request, login } = await fixture(); const session = await login()
    const response = await request('/api/state', 'PUT', { snapshot: {} }, { ...session, 'if-match': '"0"', 'idempotency-key': randomUUID() })
    expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: 'INVALID_SNAPSHOT' })
  })
  it('preserves precondition application error codes', async () => {
    const { request, login } = await fixture(); const session = await login()
    const response = await request('/api/state', 'PUT', { snapshot: snapshot() }, session)
    expect(response.status).toBe(428); expect(await response.json()).toEqual({ error: 'PRECONDITION_REQUIRED' })
  })
  it('sanitizes internal database errors', async () => {
    const store = memoryStore(); store.getState = async () => { throw new Error('postgres://secret:private@database/health') }
    const { request, login } = await fixture({ store }); const session = await login()
    const response = await request('/api/state', 'GET', undefined, session)
    expect(response.status).toBe(500); expect(await response.text()).toBe('{"error":"INTERNAL_ERROR"}')
  })
})
