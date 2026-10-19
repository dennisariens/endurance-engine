import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { createApp, loadConfig } from './http'
import { PgStore } from './store.mjs'

const url = process.env.AERION_TEST_DATABASE_URL
if (url) {
  const parsed = new URL(url)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) || !/^\/aerion_test(?:_[a-z0-9]+)*$/.test(parsed.pathname) || parsed.search || parsed.hash) throw new Error('Unsafe synthetic database URL')
}
describe.skipIf(!url)('real HTTP + PostgreSQL two-device contract', () => {
  let pool: pg.Pool, admin: pg.Pool, server: Server, store: PgStore, base: string
  const schema = 'aerion_test_' + randomUUID().replaceAll('-', '')
  const candidate = { theme: 'dark', races: [], goals: [], activities: [], blockedDates: [], decisionLog: [], currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown' } }
  async function request(path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
    return new Promise<Response>((resolve, reject) => {
      const req = httpRequest(base + path, { method, headers: { host: 'aerion.example', 'x-forwarded-proto': 'https', origin: 'https://aerion.example', 'content-type': 'application/json', ...headers } }, res => {
        const chunks: Buffer[] = []; res.on('data', c => chunks.push(c)); res.on('end', () => {
          const h = new Headers(); for (const [key, value] of Object.entries(res.headers)) if (value !== undefined) for (const x of Array.isArray(value) ? value : [value]) h.append(key, x)
          resolve(new Response(res.statusCode === 204 ? null : Buffer.concat(chunks), { status: res.statusCode, headers: h }))
        })
      }); req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end()
    })
  }
  async function login() {
    const challenge = await request('/api/auth/session'); const c = await challenge.json()
    const response = await request('/api/auth/login', 'POST', { password: 'synthetic-password' }, { cookie: challenge.headers.get('set-cookie')!.split(';')[0], 'x-csrf-token': c.csrfToken })
    expect(response.status).toBe(204)
    const cookie = response.headers.get('set-cookie')!.split(';')[0]
    const session = await (await request('/api/auth/session', 'GET', undefined, { cookie })).json()
    return { cookie, 'x-csrf-token': session.csrfToken }
  }
  beforeAll(async () => {
    admin = new pg.Pool({ connectionString: url }); await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new pg.Pool({ connectionString: url, options: `-c search_path=${schema}` })
    const ownerId = randomUUID(); store = new PgStore(pool, ownerId); await store.initialize()
    const config = loadConfig({ AERION_ORIGIN: 'https://aerion.example', AERION_OWNER_ID: ownerId, AERION_OWNER_DISPLAY_NAME: 'Synthetic owner', AERION_PASSWORD_HASH: await bcrypt.hash('synthetic-password', 10), AERION_TRUST_PROXY: 'loopback', DATABASE_URL: url })
    server = createServer(createApp({ config, store })); await new Promise<void>(r => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${(server.address() as any).port}`
  })
  afterAll(async () => {
    if (server) await new Promise<void>(r => { server.closeAllConnections(); server.close(() => r()) })
    await pool?.end(); if (admin) { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.end() }
  })
  it('enforces real persisted sessions, parallel CAS, original retries and owner isolation', async () => {
    expect((await request('/api/state')).status).toBe(401)
    const mac = await login(), phone = await login()
    expect(await (await request('/api/state', 'GET', undefined, phone)).json()).toEqual({ revision: 0, snapshot: null, updatedAt: null })
    const ids = [randomUUID(), randomUUID()]
    const bodies = [{ snapshot: candidate }, { snapshot: { ...candidate, theme: 'light' } }]
    const sessions = [mac, phone]
    const responses = await Promise.all(sessions.map((session, i) => request('/api/state', 'PUT', bodies[i], { ...session, 'if-match': '"0"', 'idempotency-key': ids[i] })))
    expect(responses.map(r => r.status).sort()).toEqual([200, 409])
    const winner = responses.findIndex(r => r.status === 200), loser = 1 - winner
    const original = await responses[winner].json()
    expect(original.revision).toBe(1)
    expect(await (await request('/api/state', 'GET', undefined, sessions[loser])).json()).toEqual(original)
    // A subsequent revision does not destroy the response for an uncertain first save.
    expect((await request('/api/state', 'PUT', bodies[loser], { ...sessions[loser], 'if-match': '"1"', 'idempotency-key': ids[loser] })).status).toBe(200)
    expect(await (await request('/api/state', 'PUT', bodies[winner], { ...sessions[winner], 'if-match': '"0"', 'idempotency-key': ids[winner] })).json()).toEqual(original)
    const other = new PgStore(pool, randomUUID()); await other.initialize()
    expect(await other.getState()).toEqual({ revision: 0, snapshot: null, updatedAt: null })
    const { rows } = await pool.query('SELECT token_hash FROM aerion_sessions WHERE authenticated = TRUE LIMIT 1')
    expect(await other.getSession(rows[0].token_hash)).toBeNull()
    expect((await request('/api/auth/logout', 'POST', {}, mac)).status).toBe(204)
    expect((await request('/api/state', 'GET', undefined, mac)).status).toBe(401)
    expect((await request('/api/state', 'GET', undefined, phone)).status).toBe(200)
  })
})
