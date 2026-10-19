import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { createApp, loadConfig } from './http'

describe('public Journey / private hosted shell static boundary', () => {
  let root: string, server: Server, port: number
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'aerion-static-synthetic-'))
    await mkdir(join(root, 'assets'))
    await mkdir(join(root, 'journey'))
    await writeFile(join(root, 'journey', 'index.html'), '<!doctype html><title>Synthetic public Journey</title><a href="/app">Athlete login</a>')
    await writeFile(join(root, 'journey', 'journey.js'), '/* synthetic public script */')
    await writeFile(join(root, 'app.html'), '<!doctype html><title>Synthetic hosted shell</title>')
    await writeFile(join(root, 'index.html'), '<!doctype html><title>Synthetic hosted shell</title>')
    await writeFile(join(root, 'assets', 'app.js'), '/* synthetic static asset */')
    await writeFile(join(root, 'assets', 'app.js.map'), '{"synthetic":"not public"}')
    const config = loadConfig({ AERION_ORIGIN: 'https://aerion.example', AERION_OWNER_ID: '11111111-1111-4111-8111-111111111111', AERION_OWNER_DISPLAY_NAME: 'Synthetic owner', AERION_PASSWORD_HASH: '$2b$10$' + 'a'.repeat(53), DATABASE_URL: 'postgresql://localhost/aerion_test', AERION_TRUST_PROXY: 'loopback', AERION_STATIC_DIR: root })
    const unused = async () => { throw new Error('Static requests must not access private state') }
    server = createServer(createApp({ config, store: { getState: unused, saveState: unused, getSession: async () => null, createSession: unused, deleteSession: unused } }))
    await new Promise<void>(r => server.listen(0, '127.0.0.1', r)); port = (server.address() as any).port
  })
  afterAll(async () => { if (server) await new Promise<void>(r => { server.closeAllConnections(); server.close(() => r()) }); if (root) await rm(root, { recursive: true, force: true }) })
  async function get(path: string, headers: Record<string, string> = {}) {
    return new Promise<{ status: number; text: string; headers: any }>((resolve, reject) => {
      const req = httpRequest({ hostname: '127.0.0.1', port, path, headers: { host: 'aerion.example', 'x-forwarded-proto': 'https', ...headers } }, res => {
        const chunks: Buffer[] = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode!, text: Buffer.concat(chunks).toString(), headers: res.headers }))
      }); req.on('error', reject); req.end()
    })
  }
  it('serves only the explicit shell/assets and never exposes private paths or source maps', async () => {
    const shell = await get('/app'); expect(shell.status).toBe(200); expect(shell.text).toContain('Synthetic hosted shell')
    expect(shell.headers['cache-control']).toContain('no-store')
    expect(shell.headers['content-security-policy']).toContain("default-src 'self'")
    expect((await get('/assets/app.js')).status).toBe(200)
    for (const path of ['/app/', '/app/goals']) expect((await get(path)).text).toContain('Synthetic hosted shell')
    const publicPage = await get('/')
    expect((await get('/', { 'sec-fetch-site': 'cross-site' })).status).toBe(200)
    expect((await get('/api/state', { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect((await get('/app', { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect(publicPage.status).toBe(200); expect(publicPage.text).toContain('Synthetic public Journey')
    expect(publicPage.text).not.toContain('Synthetic hosted shell')
    expect(publicPage.headers['content-security-policy']).toContain("connect-src 'none'")
    expect(publicPage.headers['content-security-policy']).not.toContain('unsafe-inline')
    expect((await get('/journey-assets/journey.js')).status).toBe(200)
    for (const path of ['/journey-assets/index.html', '/journey-assets/DESIGN_DOUBLE_AUDIT.md', '/journey-assets/../app.html', '/journey-assets/.env']) expect([403,404]).toContain((await get(path)).status)

    for (const path of ['/assets/app.js.map', '/.env.local', '/server/personal/schema.sql', '/assets/../app.cjs', '/assets/%2e%2e/package.json', '/unknown']) {
      const response = await get(path); expect([403, 404]).toContain(response.status); expect(response.text.length).toBeLessThan(200)
    }
    expect((await get('/api/state')).status).toBe(401)
  })
  it('fails closed rather than falling back between missing public and private builds', async () => {
    await rm(join(root, 'journey', 'index.html'))
    expect((await get('/')).status).toBe(503)
    expect((await get('/app')).text).toContain('Synthetic hosted shell')
    await rm(join(root, 'app.html'))
    expect((await get('/app')).status).toBe(503)
    expect((await get('/api/state')).status).toBe(401)
  })
})
