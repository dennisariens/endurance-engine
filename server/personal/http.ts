import express, { type Request, type Response, type NextFunction } from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { isAbsolute, resolve } from 'node:path'
import { existsSync, realpathSync } from 'node:fs'
import { validateStateSnapshot } from '../../src/data/backupSnapshot'

export type Config = {
  origin: string; host: string; ownerId: string; displayName: string; passwordHash: string
  databaseUrl: string; trustProxy: string[]; sessionMs: number; staticDir?: string
}
export type StateEnvelope = { revision: number; snapshot: unknown; updatedAt: string | null }
type Session = { csrfToken: string; authenticated: boolean; expiresAt: string | Date }
export interface Store {
  createSession(s: Session & { tokenHash: string }): Promise<unknown>
  getSession(hash: string): Promise<Session | null>
  deleteSession(hash: string): Promise<unknown>
  getState(): Promise<StateEnvelope>
  saveState(v: { revision: number; snapshot: unknown; key: string }): Promise<StateEnvelope>
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const cookieName = '__Host-aerion'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const random = () => randomBytes(32).toString('base64url')
function sameSecret(a: unknown, b: string) {
  return typeof a === 'string' && a.length < 256 && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))
}
export function loadConfig(env: Record<string, string | undefined>): Config {
  // No defaults for identity, password, database or public origin.
  try {
    const origin = new URL(env.AERION_ORIGIN ?? '')
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error()
    if (!uuid.test(env.AERION_OWNER_ID ?? '') || !env.AERION_OWNER_DISPLAY_NAME?.trim() || env.AERION_OWNER_DISPLAY_NAME.length > 100) throw new Error()
    if (!/^\$2[aby]\$(10|11|12|13|14)\$[./A-Za-z0-9]{53}$/.test(env.AERION_PASSWORD_HASH ?? '')) throw new Error()
    const db = new URL(env.DATABASE_URL ?? '')
    if (!['postgres:', 'postgresql:'].includes(db.protocol) || !db.hostname || db.pathname.length < 2) throw new Error()
    const trustProxy = (env.AERION_TRUST_PROXY ?? '').split(',').filter(Boolean)
    for (const network of trustProxy) {
      const [ip, bits] = network.split('/')
      if (network !== 'loopback' && (!isIP(ip) || (bits !== undefined && (!/^\d+$/.test(bits) || Number(bits) < 8 || Number(bits) > (isIP(ip) === 4 ? 32 : 128))))) throw new Error()
    }
    const hours = Number(env.AERION_SESSION_HOURS ?? '12')
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) throw new Error()
    let staticDir: string | undefined
    if (env.AERION_STATIC_DIR) {
      if (!isAbsolute(env.AERION_STATIC_DIR)) throw new Error()
      staticDir = realpathSync(env.AERION_STATIC_DIR)
      if (!existsSync(resolve(staticDir, 'index.html')) || !existsSync(resolve(staticDir, 'assets'))) throw new Error()
    }
    return { origin: origin.origin, host: origin.host, ownerId: env.AERION_OWNER_ID!, displayName: env.AERION_OWNER_DISPLAY_NAME!, passwordHash: env.AERION_PASSWORD_HASH!, databaseUrl: env.DATABASE_URL!, trustProxy, sessionMs: hours * 3600000, staticDir }
  } catch { throw new Error('Invalid Personal Sync configuration; consult deployment variable names.') }
}
function problem(status: number, code: string): never { throw Object.assign(new Error(code), { status, code }) }

export function createApp({ config, store, loginLimit = 10 }: { config: Config; store: Store; loginLimit?: number }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)
  app.use(helmet({ referrerPolicy: { policy: 'no-referrer' }, crossOriginResourcePolicy: { policy: 'same-origin' } }))
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    // Never construct a trusted origin from forwarded Host. The HTTPS proxy must
    // overwrite X-Forwarded-Proto; direct TLS also works without trusting proxies.
    if (req.headers.host !== config.host || !req.secure || (req.headers['x-forwarded-proto'] !== undefined && req.headers['x-forwarded-proto'] !== 'https') || (req.headers['x-forwarded-host'] !== undefined && req.headers['x-forwarded-host'] !== config.host) || (req.headers.origin !== undefined && req.headers.origin !== config.origin) || req.headers['sec-fetch-site'] === 'cross-site') {
      res.status(403).json({ error: 'ORIGIN_REQUIRED' }); return
    }
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== config.origin) { res.status(403).json({ error: 'ORIGIN_REQUIRED' }); return }
    next()
  })
  // Bounded session challenge generation and login. Memory limits are one process;
  // the reverse proxy must additionally enforce account-wide throttling.
  const challengeLimit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'RATE_LIMITED' } })
  const loginLimiter = rateLimit({ windowMs: 900000, limit: loginLimit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'RATE_LIMITED' } })
  app.use('/api', express.json({ limit: 5 * 1024 * 1024, strict: true, inflate: false }))
  async function session(req: Request) {
    const matches = (req.headers.cookie ?? '').split(';').map(x => x.trim()).filter(x => x.startsWith(cookieName + '='))
    if (matches.length !== 1) return null
    const token = matches[0].slice(cookieName.length + 1)
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
    const tokenHash = hash(token)
    const value = await store.getSession(tokenHash)
    return value ? { ...value, tokenHash } : null
  }
  function setCookie(res: Response, token: string, maxAge: number) {
    res.cookie(cookieName, token, { secure: true, httpOnly: true, sameSite: 'strict', path: '/', maxAge })
  }
  async function issue(res: Response, authenticated: boolean) {
    const token = random(), csrfToken = random(), duration = authenticated ? config.sessionMs : 600000
    await store.createSession({ tokenHash: hash(token), csrfToken, authenticated, expiresAt: new Date(Date.now() + duration).toISOString() })
    setCookie(res, token, duration)
    return { csrfToken, authenticated }
  }
  function csrf(req: Request, value: Session | null) {
    if (!value || !sameSecret(req.headers['x-csrf-token'], value.csrfToken)) problem(403, 'CSRF_REQUIRED')
  }
  app.get('/api/auth/session', challengeLimit, async (req, res) => {
    const value = await session(req) ?? await issue(res, false)
    res.json(value.authenticated ? { authenticated: true, csrfToken: value.csrfToken, owner: { displayName: config.displayName } } : { authenticated: false, csrfToken: value.csrfToken })
  })
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const value = await session(req); csrf(req, value)
    if (!req.is('application/json') || typeof req.body?.password !== 'string' || Buffer.byteLength(req.body.password, 'utf8') > 72 || req.body.password.length === 0) problem(400, 'INVALID_REQUEST')
    if (!await bcrypt.compare(req.body.password, config.passwordHash)) problem(401, 'INVALID_CREDENTIALS')
    await store.deleteSession(value!.tokenHash)
    await issue(res, true)
    res.status(204).end()
  })
  app.use('/api', async (req, res, next) => {
    const value = await session(req)
    if (!value?.authenticated) { res.status(401).json({ error: 'AUTH_REQUIRED' }); return }
    if (!['GET', 'HEAD'].includes(req.method)) csrf(req, value)
    res.locals.session = value
    next()
  })
  app.post('/api/auth/logout', async (_req, res) => {
    await store.deleteSession(res.locals.session.tokenHash)
    setCookie(res, '', 0)
    res.status(204).end()
  })
  app.get('/api/state', async (_req, res) => { const state = await store.getState(); res.set('ETag', `"${state.revision}"`).json(state) })
  app.put('/api/state', async (req, res) => {
    const match = req.headers['if-match'], key = req.headers['idempotency-key']
    if (typeof match !== 'string' || !/^"(0|[1-9]\d*)"$/.test(match) || typeof key !== 'string' || !uuid.test(key)) problem(428, 'PRECONDITION_REQUIRED')
    const revision = Number(match.slice(1, -1))
    if (!Number.isSafeInteger(revision)) problem(400, 'INVALID_REQUEST')
    let snapshot: ReturnType<typeof validateStateSnapshot>
    try {
      if (!req.is('application/json') || !req.body || Object.keys(req.body).length !== 1 || !('snapshot' in req.body)) throw new Error()
      snapshot = validateStateSnapshot(req.body.snapshot)
    } catch { problem(400, 'INVALID_SNAPSHOT') }
    // Uncertain semantic duplicates are rejected for explicit owner resolution,
    // not silently combined or admitted twice into coaching load.
    const seen = new Set<string>()
    for (const activity of snapshot.activities) {
      const fingerprint = JSON.stringify([activity.date, activity.type.toLowerCase(), activity.durationSec ?? null, activity.distanceM ?? null])
      if (seen.has(fingerprint)) problem(409, 'ACTIVITY_REVIEW_REQUIRED')
      seen.add(fingerprint)
    }
    const state = await store.saveState({ revision, snapshot, key })
    res.set('ETag', `"${state.revision}"`).json(state)
  })
  app.post('/api/sync', (req, res) => {
    if (!req.is('application/json') || !req.body || Object.keys(req.body).length || typeof req.headers['idempotency-key'] !== 'string' || !uuid.test(req.headers['idempotency-key'])) problem(400, 'INVALID_REQUEST')
    // Explicitly no provider connector in this bounded first two-device release.
    res.status(503).json({ error: 'PROVIDER_UNAVAILABLE' })
  })
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'NOT_FOUND' }) })
  if (config.staticDir) {
    // Only the reconciled, hosted-mode client build is allowed here. Never expose
    // the repo root, backup directories, source maps, dotfiles or credentials.
    app.use('/assets', (req, res, next) => { if (!/\.(js|css|woff2?|png|svg|webp|jpg)$/.test(req.path)) { res.sendStatus(404); return }; next() }, express.static(resolve(config.staticDir, 'assets'), { dotfiles: 'deny', index: false, redirect: false, fallthrough: false }))
    app.get('/', (_req, res) => { res.sendFile(resolve(config.staticDir!, 'index.html')) })
  }
  app.use((_req, res) => { res.status(config.staticDir ? 404 : 503).json({ error: config.staticDir ? 'NOT_FOUND' : 'HOSTED_CLIENT_REQUIRED' }) })
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = [400, 401, 403, 404, 409, 413, 415, 428, 429, 503].includes(error.status) ? error.status : 500
    // Only intentional application (status, code) pairs may override safe defaults.
    const applicationErrors: Record<string, number> = {
      INVALID_REQUEST: 400, INVALID_SNAPSHOT: 400, INVALID_CREDENTIALS: 401,
      CSRF_REQUIRED: 403, ACTIVITY_REVIEW_REQUIRED: 409, PRECONDITION_REQUIRED: 428,
    }
    const code = typeof error.code === 'string' && Object.hasOwn(applicationErrors, error.code) && applicationErrors[error.code] === status
      ? error.code
      : status === 500 ? 'INTERNAL_ERROR' : status === 503 ? 'PERSISTENCE_UNAVAILABLE' : status === 401 ? 'INVALID_CREDENTIALS' : status === 413 ? 'REQUEST_TOO_LARGE' : status === 409 ? 'REVISION_CONFLICT' : status === 415 ? 'JSON_REQUIRED' : status === 404 ? 'NOT_FOUND' : 'INVALID_REQUEST'
    // Never echo payloads, SQL, environment, stack traces or library messages.
    res.status(status).json({ error: code })
  })
  return app
}
