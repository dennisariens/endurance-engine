// Disposable real PostgreSQL verification. Never uses DATABASE_URL or a running
// owner's cluster. Requires local initdb/postgres; does not install/start services.
import { spawn } from 'node:child_process'
import { mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { PgStore } from '../server/personal/store.mjs'

const bin = process.env.AERION_PG_BIN ?? ''
const share = process.env.AERION_PG_SHARE
const root = await mkdtemp(join(tmpdir(), 'aerion-synthetic-pg-'))
let postgres
let web
let pool
let log = ''
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit' })
    child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error('Synthetic verification command failed')))
  })
}
const unusedPort = () => new Promise((resolve, reject) => {
  const server = createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) })
})
const port = await unusedPort()
const connectionString = `postgresql://aerion_test@127.0.0.1:${port}/aerion_test`
const adminUrl = new URL(connectionString); adminUrl.pathname = '/postgres'
async function start() {
  postgres = spawn(join(bin, 'postgres'), ['-D', join(root, 'data'), '-h', '127.0.0.1', '-p', String(port), '-k', root], { stdio: ['ignore', 'pipe', 'pipe'] })
  postgres.stdout.on('data', data => { log += data }); postgres.stderr.on('data', data => { log += data })
  let error
  postgres.once('error', e => { error = e })
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (error || postgres.exitCode !== null) throw new Error('Disposable PostgreSQL unavailable')
    const client = new pg.Client({ connectionString: adminUrl.toString(), connectionTimeoutMillis: 500 })
    try { await client.connect(); await client.query('SELECT 1'); return } catch { await new Promise(r => setTimeout(r, 100)) } finally { await client.end().catch(() => {}) }
  }
  throw new Error('Disposable PostgreSQL readiness timeout')
}
async function stop() {
  if (postgres && postgres.exitCode === null) { const child = postgres; await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGINT') }) }
}
try {
  await run(join(bin, 'initdb'), ['-D', join(root, 'data'), ...(share ? ['-L', share] : []), '--auth=trust', '--username=aerion_test', '--encoding=UTF8', '--locale=C'])
  await start()
  const client = new pg.Client({ connectionString: adminUrl.toString() }); await client.connect()
  await client.query('CREATE DATABASE aerion_test'); await client.end()
  await run('npm', ['test', '--', '--maxWorkers=2'], { ...process.env, AERION_TEST_DATABASE_URL: connectionString })
  pool = new pg.Pool({ connectionString }); const owner = randomUUID(); let store = new PgStore(pool, owner); await store.initialize()
  const request = { revision: 0, key: randomUUID(), snapshot: { theme: 'dark', races: [], goals: [], activities: [], blockedDates: [], decisionLog: [], goalConversation: [], currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown' } } }
  const committed = await store.saveState(request)
  await store.createSession({ tokenHash: 'synthetic-restart-hash', csrfToken: 'synthetic-csrf', authenticated: true, expiresAt: new Date(Date.now() + 60000).toISOString() })
  await pool.end(); await stop(); await start()
  pool = new pg.Pool({ connectionString }); store = new PgStore(pool, owner)
  assert.deepEqual(await store.getState(), committed)
  assert.deepEqual(await store.saveState(request), committed)
  assert.equal((await store.getSession('synthetic-restart-hash')).authenticated, true)
  // Exercise the compiled administrative path, including its copied schema and
  // mandatory encrypted backup-before-restore. All files are synthetic/temp.
  await run('npm', ['run', 'build:server'])
  const env = { ...process.env, DATABASE_URL: connectionString, AERION_ORIGIN: 'https://aerion.example', AERION_OWNER_ID: owner, AERION_OWNER_DISPLAY_NAME: 'Synthetic owner', AERION_PASSWORD_HASH: await bcrypt.hash('synthetic-password', 10), AERION_BACKUP_KEY: Buffer.alloc(32, 42).toString('base64'), AERION_TRUST_PROXY: 'loopback', AERION_STATIC_DIR: '' }
  await run(process.execPath, ['dist-server/admin.mjs', 'schema', '--confirm-schema'], env)
  const backup = join(root, 'synthetic.enc'), before = join(root, 'before-restore.enc')
  await run(process.execPath, ['dist-server/admin.mjs', 'backup', backup], env)
  await store.saveState({ revision: 1, key: randomUUID(), snapshot: { ...request.snapshot, theme: 'light' } })
  await run(process.execPath, ['dist-server/admin.mjs', 'restore', backup, '--confirm-restore', '--revision', '2', '--backup-before', before], env)
  await access(before)
  assert.equal((await store.getState()).revision, 3)
  assert.deepEqual((await store.getState()).snapshot, committed.snapshot)
  console.log('PASS compiled admin: explicit schema, encrypted backup, populated-state restore, backup-before, monotonic revision.')
  const webPort = await unusedPort()
  web = spawn(process.execPath, ['app.cjs'], { env: { ...env, PORT: String(webPort) }, stdio: ['ignore', 'pipe', 'pipe'] })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Compiled backend readiness timeout')), 10000)
    web.once('error', reject); web.once('exit', () => { clearTimeout(timeout); reject(new Error('Compiled backend refused startup')) })
    web.stdout.on('data', data => { if (String(data).includes('backend listening')) { clearTimeout(timeout); resolve() } })
  })
  const http = (path, method = 'GET', body, headers = {}) => new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port: webPort, path, method, headers: { host: 'aerion.example', 'x-forwarded-proto': 'https', origin: 'https://aerion.example', 'content-type': 'application/json', ...headers } }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString() }))
    }); req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end()
  })
  assert.equal((await http('/api/state')).status, 401)
  const challenge = await http('/api/auth/session')
  assert.equal(challenge.status, 200)
  const anonymousCookie = challenge.headers['set-cookie'][0].split(';')[0]
  const login = await http('/api/auth/login', 'POST', { password: 'synthetic-password' }, { cookie: anonymousCookie, 'x-csrf-token': JSON.parse(challenge.text).csrfToken })
  assert.equal(login.status, 204)
  const cookie = login.headers['set-cookie'][0].split(';')[0]
  assert.equal(JSON.parse((await http('/api/state', 'GET', undefined, { cookie })).text).revision, 3)
  assert.equal((await http('/')).status, 503) // no accidental local-mode frontend
  console.log('PASS compiled app.cjs HTTP + PG: secure login and canonical read; absent hosted client fails closed.')
  console.log('PASS actual PostgreSQL stop/start: canonical state, original idempotent response, authenticated session persisted.')
} catch (error) {
  console.error(error.message); process.exitCode = 1
} finally {
  if (web && web.exitCode === null) { const child = web; await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM') }) }
  await pool?.end().catch(() => {})
  await stop()
  await rm(root, { recursive: true, force: true })
}
