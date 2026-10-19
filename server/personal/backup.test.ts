import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createCipheriv } from 'node:crypto'
import { join, resolve } from 'node:path'
import { encryptBackup, decryptBackup, MAX_BACKUP_BYTES } from './backup'
import { runAdmin, validateBackupPath } from './admin'

// Minimal synthetic state using the existing application's schema (no personal fixtures).
const snapshot = () => ({ theme: 'dark', races: [], goals: [], activities: [], blockedDates: [], decisionLog: [], currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown' } })
const owner = '11111111-1111-4111-8111-111111111111'
const env = { AERION_BACKUP_KEY: Buffer.alloc(32, 7).toString('base64'), AERION_ORIGIN: 'https://synthetic.example', AERION_OWNER_ID: owner, AERION_OWNER_DISPLAY_NAME: 'Synthetic', AERION_PASSWORD_HASH: '$2b$10$' + 'a'.repeat(53), DATABASE_URL: 'postgresql://localhost/synthetic_only' }
const state = () => ({ revision: 4, snapshot: snapshot(), updatedAt: '2026-10-01T00:00:00.000Z' })
const dirs: string[] = []
afterEach(async () => { await Promise.all(dirs.splice(0).map(p => rm(p, { recursive: true, force: true }))) })
async function directory() { const p = await mkdtemp(join(tmpdir(), 'aerion-synthetic-')); dirs.push(p); return p }
function harness(initial: any = { revision: 0, snapshot: null, updatedAt: null }) {
  let current = initial, closed = 0, initialized = 0
  const writes: any[] = [], output: string[] = []
  const store = { async initialize() { initialized++ }, async getState() { return current }, async saveState(v: any) { if (v.revision !== current.revision) throw new Error('private database detail'); writes.push(v); current = { revision: current.revision + 1, snapshot: v.snapshot, updatedAt: '2026-10-02T00:00:00.000Z' }; return current } }
  return { deps: { createPool: () => ({ async end() { closed++ } }), createStore: () => store, output: (s: string) => output.push(s) }, writes, output, get closed() { return closed }, get initialized() { return initialized }, get current() { return current } }
}
describe('authenticated bounded encrypted canonical backups', () => {
  it('round trips validated state with random IVs and no cleartext snapshot', () => {
    const a = encryptBackup(state(), owner, env), b = encryptBackup(state(), owner, env)
    expect(a).not.toEqual(b); expect(a).not.toContain('injury_present')
    expect(decryptBackup(a, owner, env)).toMatchObject(state())
    expect(Buffer.from(JSON.parse(a).iv, 'base64')).toHaveLength(12)
  })
  it('rejects tampering, wrong owner, wrong key and malformed envelopes generically', () => {
    const encoded = encryptBackup(state(), owner, env), changed = JSON.parse(encoded)
    changed.ciphertext = Buffer.alloc(Buffer.from(changed.ciphertext, 'base64').length).toString('base64')
    for (const [data, id, secrets] of [[JSON.stringify(changed), owner, env], [encoded, 'other-owner', env], [encoded, owner, { AERION_BACKUP_KEY: Buffer.alloc(32, 9).toString('base64') }], ['{}', owner, env], ['x'.repeat(MAX_BACKUP_BYTES + 1), owner, env]] as const) {
      expect(() => decryptBackup(data, id, secrets)).toThrow('Invalid encrypted backup')
    }
  })
  it('authenticates owner metadata and validates decrypted payloads even with valid GCM tags', () => {
    const encoded = encryptBackup(state(), owner, env)
    const rewrittenOwner = { ...JSON.parse(encoded), ownerId: 'different-owner' }
    expect(() => decryptBackup(JSON.stringify(rewrittenOwner), 'different-owner', env)).toThrow('Invalid encrypted backup')
    expect(() => decryptBackup(encoded, owner, {})).toThrow('Invalid encrypted backup')
    for (const payload of [{ ...state(), snapshot: {} }, { ...state(), revision: -2 }, { ...state(), extra: 'rejected' }]) {
      const header = JSON.parse(encoded), iv = Buffer.alloc(12, 8)
      const cipher = createCipheriv('aes-256-gcm', Buffer.from(env.AERION_BACKUP_KEY, 'base64'), iv)
      cipher.setAAD(Buffer.from(JSON.stringify({ format: header.format, version: header.version, algorithm: header.algorithm, ownerId: owner })))
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()])
      const crafted = { ...header, iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') }
      expect(() => decryptBackup(JSON.stringify(crafted), owner, env)).toThrow('Invalid encrypted backup')
    }
  })
  it('requires a canonical exact 32-byte base64 key and valid populated snapshots/revisions', () => {
    for (const key of [undefined, '', 'not-base64', Buffer.alloc(31).toString('base64'), env.AERION_BACKUP_KEY + '\n']) expect(() => encryptBackup(state(), owner, { AERION_BACKUP_KEY: key })).toThrow('Invalid encrypted backup')
    for (const value of [{ ...state(), snapshot: {} }, { ...state(), snapshot: null }, { ...state(), revision: -1 }, { ...state(), unexpected: true }]) expect(() => encryptBackup(value, owner, env)).toThrow('Invalid encrypted backup')
  })
})
// Exact UTF-8 canonical size; padding is only a synthetic goal description.
function sizedSnapshot(bytes: number, normalized = true) {
  const value = { ...snapshot(), goals: [{ id: 'synthetic-goal', name: 'Synthetic', type: 'floating-goal', discipline: 'cycling', status: 'draft', description: '' }], ...(normalized ? { goalConversation: [] } : {}) }
  value.goals[0].description = 'x'.repeat(bytes - Buffer.byteLength(JSON.stringify(value)))
  expect(Buffer.byteLength(JSON.stringify(value))).toBe(bytes)
  return value
}
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024

describe('explicit protected admin commands', () => {
  it.each(['preview', 'import-empty'])('rejects a valid 6.5 MiB plain snapshot before %s can write state', async command => {
    const file = join(await directory(), 'large.json'), h = harness()
    await writeFile(file, JSON.stringify({ ...sizedSnapshot(6.5 * 1024 * 1024), version: 2, exportedAt: '2026-10-01' }))
    await expect(runAdmin(command === 'preview' ? [command, file] : [command, file, '--confirm-empty'], env, h.deps)).rejects.toThrow('Admin command failed')
    expect(h.writes).toHaveLength(0); expect(h.closed).toBe(0); expect(h.output).toHaveLength(0)
  })
  it('measures normalized canonical bytes including the default goal conversation', async () => {
    const file = join(await directory(), 'normalization.json'), h = harness()
    await writeFile(file, JSON.stringify({ ...sizedSnapshot(MAX_SNAPSHOT_BYTES, false), version: 2, exportedAt: '2026-10-01' }))
    await expect(runAdmin(['import-empty', file, '--confirm-empty'], env, h.deps)).rejects.toThrow('Admin command failed')
    expect(h.writes).toHaveLength(0); expect(h.closed).toBe(0)
  })
  it('accepts a canonical 5 MiB import and can encrypt and decrypt the saved state', async () => {
    const file = join(await directory(), 'near-limit.json'), h = harness()
    await writeFile(file, JSON.stringify({ ...sizedSnapshot(MAX_SNAPSHOT_BYTES), version: 2, exportedAt: '2026-10-01' }))
    await runAdmin(['preview', file], {}, h.deps)
    await runAdmin(['import-empty', file, '--confirm-empty'], env, h.deps)
    expect(h.writes).toHaveLength(1)
    const encoded = encryptBackup(h.current, owner, env)
    expect(Buffer.byteLength(encoded)).toBeLessThan(MAX_BACKUP_BYTES)
    expect(decryptBackup(encoded, owner, env)).toEqual(h.current)
  })
  it('rejects restored canonical snapshots above 5 MiB before backup or state writes', async () => {
    const dir = await directory(), file = join(dir, 'oversized.enc'), before = join(dir, 'before.enc'), h = harness(state())
    await writeFile(file, encryptBackup({ ...state(), snapshot: sizedSnapshot(MAX_SNAPSHOT_BYTES + 1) }, owner, env))
    await expect(runAdmin(['restore', file, '--confirm-restore', '--revision', '4', '--backup-before', before], env, h.deps)).rejects.toThrow('Admin command failed')
    expect(h.writes).toHaveLength(0); expect(h.closed).toBe(0)
    await expect(stat(before)).rejects.toMatchObject({ code: 'ENOENT' })
  })
  it('rejects relative, repository, static and symlinked-public output paths', async () => {
    const dir = await directory()
    for (const path of ['relative.enc', resolve('backup.enc'), join(dir, 'public', 'out.enc')]) await expect(validateBackupPath(path, join(dir, 'public'))).rejects.toThrow()
    await symlink(process.cwd(), join(dir, 'alias'))
    await expect(validateBackupPath(join(dir, 'alias', 'out.enc'))).rejects.toThrow()
    await expect(validateBackupPath(join(dir, 'safe.enc'))).resolves.toBeTruthy()
  })
  it('requires explicit schema confirmation and always closes a created pool', async () => {
    const h = harness()
    await expect(runAdmin(['schema'], env, h.deps)).rejects.toThrow('Admin command failed')
    expect(h.initialized).toBe(0)
    await runAdmin(['schema', '--confirm-schema'], env, h.deps)
    expect(h.initialized).toBe(1); expect(h.closed).toBeGreaterThan(0)
  })
  it('previews only field names and counts and rejects invalid plain backup input', async () => {
    const file = join(await directory(), 'plain.json'), h = harness()
    await writeFile(file, JSON.stringify({ ...snapshot(), version: 2, exportedAt: '2026-10-01', account: { status: 'local', displayName: 'SENSITIVE_SYNTHETIC_VALUE', localOnly: true } }))
    await runAdmin(['preview', file], {}, h.deps)
    expect(h.output.join('')).toContain('races'); expect(h.output.join('')).not.toContain('SENSITIVE_SYNTHETIC_VALUE'); expect(h.closed).toBe(0)
    await writeFile(file, JSON.stringify({ version: 3 }))
    await expect(runAdmin(['preview', file], {}, h.deps)).rejects.toThrow('Admin command failed')
  })
  it('imports strictly validated plain backup only with confirmation into empty revision zero', async () => {
    const file = join(await directory(), 'plain.json'), h = harness()
    await writeFile(file, JSON.stringify({ ...snapshot(), version: 2, exportedAt: '2026-10-01' }))
    await expect(runAdmin(['import-empty', file], env, h.deps)).rejects.toThrow()
    await runAdmin(['import-empty', file, '--confirm-empty'], env, h.deps)
    expect(h.writes).toHaveLength(1); expect(h.writes[0].revision).toBe(0); expect(h.writes[0].key).toMatch(/^[a-f0-9-]{36}$/)
    await expect(runAdmin(['import-empty', file, '--confirm-empty'], env, h.deps)).rejects.toThrow()
    expect(h.writes).toHaveLength(1)
  })
  it('writes populated backups exclusively with private permissions and refuses empty state', async () => {
    const file = join(await directory(), 'encrypted.json'), h = harness(state())
    await runAdmin(['backup', file], env, h.deps)
    expect((await stat(file)).mode & 0o777).toBe(0o600)
    expect(decryptBackup(await readFile(file, 'utf8'), owner, env)).toMatchObject(state())
    await expect(runAdmin(['backup', file], env, h.deps)).rejects.toThrow()
    await expect(runAdmin(['backup', file + '.empty'], env, harness().deps)).rejects.toThrow()
  })
  it('requires explicit restore CAS and durable pre-backup before monotonic save', async () => {
    const dir = await directory(), file = join(dir, 'restore.enc'), before = join(dir, 'before.enc'), h = harness(state())
    await writeFile(file, encryptBackup({ ...state(), revision: 1, snapshot: { ...snapshot(), theme: 'light' } }, owner, env))
    for (const args of [ ['restore', file], ['restore', file, '--confirm-restore', '--revision', '4'], ['restore', file, '--confirm-restore', '--revision', '3', '--backup-before', before] ]) await expect(runAdmin(args, env, h.deps)).rejects.toThrow()
    expect(h.writes).toHaveLength(0)
    await runAdmin(['restore', file, '--confirm-restore', '--revision', '4', '--backup-before', before], env, h.deps)
    expect(decryptBackup(await readFile(before, 'utf8'), owner, env)).toMatchObject(state())
    expect(h.current.revision).toBe(5); expect(h.current.snapshot.theme).toBe('light'); expect(h.writes[0].revision).toBe(4)
    expect(h.closed).toBeGreaterThan(0)
  })
  it('does not restore if exclusive pre-backup cannot be written', async () => {
    const dir = await directory(), file = join(dir, 'restore.enc'), h = harness(state())
    await writeFile(file, encryptBackup(state(), owner, env))
    await expect(runAdmin(['restore', file, '--confirm-restore', '--revision', '4', '--backup-before', file], env, h.deps)).rejects.toThrow()
    expect(h.writes).toHaveLength(0); expect(h.closed).toBe(1)
  })
})
