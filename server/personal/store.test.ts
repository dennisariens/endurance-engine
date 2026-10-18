import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

// Opt in ONLY to a disposable loopback database named aerion_test[_suffix].
// No DATABASE_URL fallback: these tests create/drop only their own random schema.
function safeTestUrl(value: string) {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Unsafe PostgreSQL test URL') }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    || !/^\/aerion_test(?:_[a-z0-9]+)*$/.test(url.pathname)
    || url.search || url.hash) throw new Error('Unsafe PostgreSQL test URL')
  return value
}

it('refuses remote, non-test and connection-override database URLs', () => {
  for (const url of ['postgres://remote/aerion_test', 'postgres://localhost/postgres',
    'postgres://localhost/aerion_test?host=remote', 'file:///aerion_test']) {
    expect(() => safeTestUrl(url)).toThrow('Unsafe PostgreSQL test URL')
  }
  expect(safeTestUrl('postgres://127.0.0.1/aerion_test_synthetic')).toContain('synthetic')
})

const configuredUrl = process.env.AERION_TEST_DATABASE_URL
const connectionString = configuredUrl ? safeTestUrl(configuredUrl) : undefined
if (!connectionString) console.info('SKIP PostgreSQL integration: set AERION_TEST_DATABASE_URL to a disposable loopback aerion_test[_suffix] database')

describe.skipIf(!connectionString)('PgStore (real PostgreSQL)', () => {
  const schema = `aerion_test_${randomUUID().replaceAll('-', '')}`
  let admin: pg.Pool
  let pool: pg.Pool
  let PgStore: any
  let store: any
  const owner = `test-owner-${randomUUID()}`
  const snapshot = { athlete: { name: 'Synthetic only' }, workouts: [] }
  const fresh = () => new PgStore(pool, owner)

  beforeAll(async () => {
    ;({ PgStore } = await import('./store.mjs'))
    admin = new pg.Pool({ connectionString })
    await admin.query(`CREATE SCHEMA "${schema}"`)
    pool = new pg.Pool({ connectionString, options: `-c search_path=${schema}`, max: 8 })
    store = fresh()
    await store.initialize()
  })
  afterAll(async () => {
    await pool?.end()
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await admin.end()
    }
  })

  it('initializes explicitly and idempotently with an empty envelope', async () => {
    await store.initialize()
    expect(await store.getState()).toEqual({ revision: 0, snapshot: null, updatedAt: null })
  })

  it('persists a snapshot, timestamp and payload-bound replay across store instances', async () => {
    const result = await store.saveState({ revision: 0, snapshot, key: 'first' })
    expect(result).toEqual({ revision: 1, snapshot, updatedAt: expect.any(String) })
    expect(Number.isNaN(Date.parse(result.updatedAt))).toBe(false)
    expect(await fresh().getState()).toEqual(result)
    await store.saveState({ revision: 1, snapshot: { next: true }, key: 'second' })
    expect(await fresh().saveState({ revision: 0, snapshot, key: 'first' })).toEqual(result)
    await expect(store.saveState({ revision: 0, snapshot: { secret: 'never expose this' }, key: 'first' }))
      .rejects.toMatchObject({ status: 409, message: 'State conflict' })
    await expect(store.saveState({ revision: 1, snapshot, key: 'first' })).rejects.toMatchObject({ status: 409 })
  })

  it('allows exactly one competing CAS writer and leaves rejected keys reusable', async () => {
    const revision = (await store.getState()).revision
    const requests = ['race-a', 'race-b'].map(key => ({ revision, snapshot: { key }, key }))
    const results = await Promise.allSettled(requests.map(request => fresh().saveState(request)))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    const loser = results.findIndex(result => result.status === 'rejected')
    expect((results[loser] as PromiseRejectedResult).reason.status).toBe(409)
    const current = await store.getState()
    expect(current.revision).toBe(revision + 1)
    expect((await store.saveState({ ...requests[loser], revision: current.revision })).revision).toBe(revision + 2)
  })

  it('serializes concurrent identical retries to the same successful result', async () => {
    const request = { revision: (await store.getState()).revision, snapshot, key: 'parallel-retry' }
    const results = await Promise.all(Array.from({ length: 6 }, () => fresh().saveState(request)))
    expect(results.every(result => JSON.stringify(result) === JSON.stringify(results[0]))).toBe(true)
    expect((await store.getState()).revision).toBe(request.revision + 1)
  })

  it('isolates state, idempotency keys and sessions by owner', async () => {
    const other = new PgStore(pool, 'another-synthetic-owner')
    await other.initialize()
    expect(await other.getState()).toEqual({ revision: 0, snapshot: null, updatedAt: null })
    expect((await other.saveState({ revision: 0, snapshot: { other: true }, key: 'first' })).revision).toBe(1)
    await store.createSession({ tokenHash: 'shared-test-hash', csrfToken: 'test-csrf', authenticated: false, expiresAt: new Date(Date.now() + 60_000) })
    expect(await other.getSession('shared-test-hash')).toBeNull()
    await other.deleteSession('shared-test-hash')
    expect(await fresh().getSession('shared-test-hash')).toMatchObject({ csrfToken: 'test-csrf', authenticated: false })
  })

  it('persists authenticated and anonymous sessions, expires and deletes them', async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    await store.createSession({ tokenHash: 'authenticated-hash', csrfToken: 'csrf', authenticated: true, expiresAt })
    expect(await fresh().getSession('authenticated-hash')).toEqual({ csrfToken: 'csrf', authenticated: true, expiresAt })
    await store.createSession({ tokenHash: 'expired-hash', csrfToken: 'expired', authenticated: false, expiresAt: new Date(Date.now() - 1000) })
    expect(await store.getSession('expired-hash')).toBeNull()
    await store.deleteSession('authenticated-hash')
    expect(await fresh().getSession('authenticated-hash')).toBeNull()
  })

  it('rejects invalid and unsafe revisions without changing state', async () => {
    const before = await store.getState()
    for (const revision of [-1, 0.5, '0', Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(store.saveState({ revision, snapshot, key: `invalid-${revision}` })).rejects.toMatchObject({ status: 400 })
    }
    expect(await store.getState()).toEqual(before)
  })

  it('reads durable state, replay and sessions through an independent connection pool', async () => {
    const anotherPool = new pg.Pool({ connectionString, options: `-c search_path=${schema}` })
    try {
      const restarted = new PgStore(anotherPool, owner)
      expect(await restarted.getState()).toEqual(await store.getState())
      expect(await restarted.saveState({ revision: 0, snapshot, key: 'first' })).toMatchObject({ revision: 1, snapshot })
      expect(await restarted.getSession('shared-test-hash')).toMatchObject({ authenticated: false })
    } finally {
      await anotherPool.end()
    }
  })

  it('rolls back state when persisting the replay record fails', async () => {
    const before = await store.getState()
    await pool.query("ALTER TABLE aerion_state_requests ADD CONSTRAINT test_replay_failure CHECK (idempotency_key <> 'force-rollback')")
    try {
      await expect(store.saveState({ revision: before.revision, snapshot, key: 'force-rollback' }))
        .rejects.toMatchObject({ status: 503, message: 'Persistence unavailable' })
      expect(await store.getState()).toEqual(before)
    } finally {
      await pool.query('ALTER TABLE aerion_state_requests DROP CONSTRAINT test_replay_failure')
    }
    expect((await store.saveState({ revision: before.revision, snapshot, key: 'force-rollback' })).revision).toBe(before.revision + 1)
  })

  it('increments the final safe revision without precision loss or overflow', async () => {
    const boundary = new PgStore(pool, 'synthetic-boundary-owner')
    await boundary.initialize()
    await pool.query('UPDATE aerion_owner_state SET revision = $2 WHERE owner_id = $1', ['synthetic-boundary-owner', String(Number.MAX_SAFE_INTEGER - 1)])
    expect((await boundary.saveState({ revision: Number.MAX_SAFE_INTEGER - 1, snapshot, key: 'last-safe' })).revision).toBe(Number.MAX_SAFE_INTEGER)
    await expect(boundary.saveState({ revision: Number.MAX_SAFE_INTEGER, snapshot, key: 'overflow' })).rejects.toMatchObject({ status: 400 })
    expect((await boundary.getState()).revision).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('rejects incompatible schema versions without leaking database details', async () => {
    await pool.query('UPDATE aerion_schema_version SET version = 999 WHERE singleton = TRUE')
    try {
      await expect(fresh().initialize()).rejects.toMatchObject({ message: 'Persistence unavailable', status: 503 })
    } finally {
      await pool.query('UPDATE aerion_schema_version SET version = 1 WHERE singleton = TRUE')
    }
  })
})
