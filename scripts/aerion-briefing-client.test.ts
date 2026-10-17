import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { fetchBriefing, snapshotPathFromArgs } from './aerion-briefing-client.mjs'
import { createBriefingHandler } from '../server/briefingHttp'

const servers: ReturnType<typeof createServer>[] = []
const dirs: string[] = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) })))
  await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})
const synthetic = { activities: [], races: [], goals: [], state: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 70, last_updated: '2026-10-17' } }
async function file(content = JSON.stringify(synthetic)) { const dir = await mkdtemp(join(tmpdir(), 'aerion-synthetic-')); dirs.push(dir); const path = join(dir, 'snapshot.json'); await writeFile(path, content); return path }
async function service(handler = createBriefingHandler()) {
  const calls: { url?: string; method?: string; body: string }[] = []
  const server = createServer(async (req, res) => {
    // Observe real stream while letting the handler consume it.
    const call = { url: req.url, method: req.method, body: '' }; calls.push(call)
    req.on('data', chunk => { call.body += chunk.toString() })
    await handler(req, res)
  }); servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return { baseUrl: `http://127.0.0.1:${(server.address() as { port: number }).port}`, calls }
}
function run(script: string, args: string[], baseUrl: string, snapshotPath = '', stdin = '', extra: { env?: Record<string, string>; execArgv?: string[] } = {}) {
  return new Promise<{ code: number | null; out: string; err: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [...(extra.execArgv ?? []), script, ...args], { env: { PATH: process.env.PATH, AERION_BASE_URL: baseUrl, AERION_SNAPSHOT_PATH: snapshotPath, ...extra.env }, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = '', err = ''
    child.stdout.on('data', chunk => { out += chunk }); child.stderr.on('data', chunk => { err += chunk }); child.on('error', reject)
    child.on('close', code => resolve({ code, out, err })); child.stdin.end(stdin)
  })
}

describe('explicit snapshot briefing clients', () => {
  it('defaults to GET with actionable sanitized unavailable, without fixtures', async () => {
    const { baseUrl, calls } = await service()
    const result = await fetchBriefing({ baseUrl })
    expect(result).toMatchObject({ ok: false, code: 'BROWSER_SNAPSHOT_REQUIRED' })
    expect(result.message).toContain('AERION_SNAPSHOT_PATH')
    expect(calls).toMatchObject([{ method: 'GET', url: '/api/briefing', body: '' }])
  })
  it('POSTs only explicitly selected snapshot contents, including date in body not URL', async () => {
    const { baseUrl, calls } = await service()
    const result = await fetchBriefing({ baseUrl, date: '2026-10-17', snapshotPath: await file() })
    expect(result.ok).toBe(true)
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/api/briefing' })
    expect(JSON.parse(calls[0].body)).toEqual({ ...synthetic, date: '2026-10-17' })
  })
  it.each(['', '/', '/aerion', '/aerion/', '/nested/aerion', '/nested/aerion/'])('preserves base path %j for GET and snapshot POST', async prefix => {
    const { baseUrl, calls } = await service()
    const endpoint = `${prefix.replace(/\/$/, '')}/api/briefing`
    const options = { baseUrl: baseUrl + prefix, date: '2026-10-17' }
    expect(await fetchBriefing(options)).toMatchObject({ ok: false, code: 'BROWSER_SNAPSHOT_REQUIRED' })
    expect((await fetchBriefing({ ...options, snapshotPath: await file() })).ok).toBe(true)
    expect(calls.map(({ method, url }) => ({ method, url }))).toEqual([
      { method: 'GET', url: endpoint }, { method: 'POST', url: endpoint },
    ])
    expect(JSON.parse(calls[1].body)).toEqual({ ...synthetic, date: '2026-10-17' })
  })
  it('CLI and MCP retain a configured deployment prefix', async () => {
    const { baseUrl, calls } = await service()
    const snapshot = await file()
    const cli = await run('scripts/aerion-briefing-context.mjs', ['--snapshot', snapshot, '--date=2026-10-17'], baseUrl + '/nested/aerion')
    expect(cli.code).toBe(0)
    expect(JSON.parse(cli.out).ok).toBe(true)
    const message = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_aerion_context', arguments: { date: '2026-10-17' } } }) + '\n'
    const mcp = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl + '/nested/aerion/', snapshot, message)
    expect(mcp.code).toBe(0)
    expect(JSON.parse(JSON.parse(mcp.out).result.content[0].text).ok).toBe(true)
    expect(calls.map(call => call.url)).toEqual(['/nested/aerion/api/briefing', '/nested/aerion/api/briefing'])
    expect(calls.every(call => call.method === 'POST')).toBe(true)
  })
  it('provides actionable unavailability for missing or stale snapshot evidence without echoing body data', async () => {
    const { baseUrl } = await service()
    const missing = { ...synthetic, state: { injury_present: false, illness_present: false, recovery_status: 'unknown' } }
    const stale = { ...synthetic, state: { ...synthetic.state, last_updated: '2026-10-10' } }
    for (const [snapshot, code] of [[missing, 'COACHING_EVIDENCE_MISSING'], [stale, 'COACHING_EVIDENCE_STALE']] as const) {
      const result = await fetchBriefing({ baseUrl, snapshotPath: await file(JSON.stringify(snapshot)), date: '2026-10-17' })
      expect(result).toMatchObject({ ok: false, code })
      expect(result.message).toContain('recovery evidence')
      expect(result).not.toHaveProperty('briefing')
    }
  })
  it('accepts an explicit browser backup file without forwarding account/UI settings', async () => {
    const { baseUrl, calls } = await service()
    const { state, ...rest } = synthetic
    const result = await fetchBriefing({ baseUrl, snapshotPath: await file(JSON.stringify({ ...rest, currentState: state, theme: 'dark', account: { email: 'private@example.invalid' } })) })
    expect(result.ok).toBe(true)
    expect(calls[0].body).not.toContain('private@example.invalid')
  })
  it('never echoes server error bodies, file paths, or underlying failures', async () => {
    const { baseUrl } = await service(async (_req, res) => { res.statusCode = 500; res.end('private-token') })
    for (const options of [{ baseUrl }, { baseUrl, snapshotPath: '/private-token/missing.json' }, { baseUrl, snapshotPath: await file('private-token') }, { baseUrl: 'http://private-token@127.0.0.1' }]) {
      const result = await fetchBriefing(options)
      expect(result.ok).toBe(false); expect(result.code).toBeTruthy(); expect(JSON.stringify(result)).not.toContain('private-token')
    }
  })
  it('bounds snapshot files and rejects invalid dates before sending', async () => {
    const { baseUrl, calls } = await service()
    expect((await fetchBriefing({ baseUrl, snapshotPath: await file('x'.repeat(2_000_001)) })).code).toBe('INVALID_SNAPSHOT_FILE')
    expect((await fetchBriefing({ baseUrl, snapshotPath: await file(), date: '2026-02-30' })).code).toBe('INVALID_DATE')
    expect(calls).toHaveLength(0)
  })
  it('does not follow redirects with a private snapshot', async () => {
    const target = await service()
    const redirect = await service(async (_req, res) => { res.writeHead(307, { Location: target.baseUrl + '/api/briefing' }); res.end() })
    expect((await fetchBriefing({ baseUrl: redirect.baseUrl, snapshotPath: await file() })).ok).toBe(false)
    expect(redirect.calls).toHaveLength(1)
    expect(target.calls).toHaveLength(0)
  })
  it('parses opt-in CLI flags or env and rejects missing flags', () => {
    expect(snapshotPathFromArgs(['--snapshot', 'chosen.json'], {})).toBe('chosen.json')
    expect(snapshotPathFromArgs(['--snapshot=chosen.json'], {})).toBe('chosen.json')
    expect(snapshotPathFromArgs([], { AERION_SNAPSHOT_PATH: 'chosen.json' })).toBe('chosen.json')
    expect(() => snapshotPathFromArgs(['--snapshot'], {})).toThrow('requires a file')
  })
  it('CLI safely reports GET migration and supports --snapshot', async () => {
    const { baseUrl, calls } = await service()
    const missing = await run('scripts/aerion-briefing-context.mjs', [], baseUrl)
    expect(missing.code).toBe(1); expect(missing.err).toContain('BROWSER_SNAPSHOT_REQUIRED')
    const success = await run('scripts/aerion-briefing-context.mjs', ['--snapshot', await file(), '--date=2026-10-17'], baseUrl)
    expect(success.code).toBe(0); expect(JSON.parse(success.out).ok).toBe(true)
    expect(calls.map(call => call.method)).toEqual(['GET', 'POST'])
  })
  it('does not return athlete context when provider credentials are absent', async () => {
    const { baseUrl } = await service()
    const selected = await file()
    const message = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'ask_aerion_openai', arguments: { prompt: 'synthetic question', date: '2026-10-17' } } }) + '\n'
    // Isolate all key lookup locations to an empty temporary directory.
    const result = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl, selected, message, { env: { HOME: dirname(selected), AERION_ROOT: dirname(selected) } })
    const payload = JSON.parse(JSON.parse(result.out).result.content[0].text)
    expect(payload.ok).toBe(false)
    expect(payload.message).toContain('API key')
    expect(payload.context).toBeUndefined()
  })
  it('sanitizes provider failures and exceptions without returning private context', async () => {
    const { baseUrl } = await service()
    const message = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'ask_aerion_openai', arguments: { prompt: 'synthetic question', date: '2026-10-17' } } }) + '\n'
    // Explicit transport fault injection: no external request or real credentials.
    for (const behavior of ["throw new Error('private-token')", "return new Response(JSON.stringify({error:{message:'private-token'}}),{status:500,headers:{'Content-Type':'application/json'}})"]) {
      const loader = `const realFetch=globalThis.fetch;globalThis.fetch=(url,opts)=>{if(String(url).startsWith('https://api.openai.com/')){${behavior}}return realFetch(url,opts)}`
      const result = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl, await file(), message, { env: { AERION_OPENAI_API_KEY: 'synthetic-test-key' }, execArgv: ['--import', 'data:text/javascript,' + encodeURIComponent(loader)] })
      expect(result.out).not.toContain('private-token')
      expect(result.out).not.toContain('athleteState')
    }
  })
  it('sanitizes MCP protocol errors instead of echoing attacker-supplied names', async () => {
    const { baseUrl } = await service()
    for (const message of [{ jsonrpc: '2.0', id: 1, method: 'private-token' }, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'private-token' } }]) {
      const result = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl, '', JSON.stringify(message) + '\n')
      expect(JSON.parse(result.out).error).toBeTruthy()
      expect(result.out).not.toContain('private-token')
    }
  })
  it('MCP uses only explicit env/CLI snapshot selection, never tool-supplied local paths', async () => {
    const { baseUrl, calls } = await service()
    const message = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_aerion_context', arguments: { snapshotPath: '/private-token', date: '2026-10-17' } } }) + '\n'
    const missing = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl, '', message)
    const missingPayload = JSON.parse(JSON.parse(missing.out).result.content[0].text)
    expect(missingPayload).toMatchObject({ ok: false, code: 'BROWSER_SNAPSHOT_REQUIRED' })
    const success = await run('scripts/aerion-openai-mcp.mjs', [], baseUrl, await file(), message)
    expect(JSON.parse(JSON.parse(success.out).result.content[0].text).ok).toBe(true)
    expect(calls.map(call => call.method)).toEqual(['GET', 'POST'])
    expect(JSON.stringify(calls)).not.toContain('private-token')
  })
})
