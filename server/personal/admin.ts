import { randomUUID } from 'node:crypto'
import { open, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import pg from 'pg'
import { loadConfig, type StateEnvelope } from './http'
import { PgStore } from './store.mjs'
import { validateBackupSnapshot, validateStateSnapshot } from '../../src/data/backupSnapshot'
import { decryptBackup, encryptBackup, MAX_BACKUP_BYTES, type BackupEnvironment } from './backup'

type AdminStore = {
  initialize(): Promise<unknown>
  getState(): Promise<StateEnvelope>
  saveState(value: { revision: number; snapshot: unknown; key: string }): Promise<StateEnvelope>
}
type AdminPool = { end(): Promise<unknown> }
export type AdminDependencies = {
  createPool?: (databaseUrl: string) => AdminPool
  createStore?: (pool: AdminPool, ownerId: string) => AdminStore
  output?: (message: string) => void
}
function failure(): never { throw new Error('Admin command failed') }
function inside(path: string, root: string) { const r = relative(root, path); return r === '' || (!r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r)) }

/** Existing parent is canonicalized; exclusive creation rejects existing files and leaf symlinks. */
export async function validateBackupPath(path: string, staticDir?: string): Promise<string> {
  try {
    if (!isAbsolute(path)) failure()
    const normalized = resolve(path), parent = await realpath(dirname(normalized))
    const target = resolve(parent, basename(normalized)), repo = await realpath(process.cwd())
    if (inside(normalized, resolve(process.cwd())) || inside(target, repo)) failure()
    if (staticDir && (inside(normalized, resolve(staticDir)) || inside(target, await realpath(staticDir)))) failure()
    if ([...normalized.split(sep), ...target.split(sep)].some(part => /^(public|static)$/i.test(part))) failure()
    return target
  } catch { failure() }
}
async function readBounded(path: string): Promise<string> {
  const file = await open(path, 'r')
  try {
    const info = await file.stat()
    if (!info.isFile() || info.size > MAX_BACKUP_BYTES) failure()
    const buffer = Buffer.alloc(MAX_BACKUP_BYTES + 1)
    let total = 0
    while (total < buffer.length) {
      const { bytesRead } = await file.read(buffer, total, buffer.length - total, null)
      if (!bytesRead) break
      total += bytesRead
    }
    if (total > MAX_BACKUP_BYTES) failure()
    return buffer.subarray(0, total).toString('utf8')
  } finally { await file.close() }
}
async function writeEncrypted(path: string, state: StateEnvelope, ownerId: string, env: BackupEnvironment, staticDir?: string) {
  const target = await validateBackupPath(path, staticDir), encoded = encryptBackup(state, ownerId, env)
  const file = await open(target, 'wx', 0o600)
  try { await file.writeFile(encoded, 'utf8'); await file.sync() } finally { await file.close() }
  // Ensure the mandatory pre-restore backup's directory entry is durable too.
  const directory = await open(dirname(target), 'r')
  try { await directory.sync() } finally { await directory.close() }
}
// Bound canonical, normalized state separately from the 8 MiB encrypted envelope.
function boundedSnapshot(input: unknown) {
  const snapshot = validateStateSnapshot(input)
  if (Buffer.byteLength(JSON.stringify(snapshot), 'utf8') > 5 * 1024 * 1024) failure()
  return snapshot
}
async function plainSnapshot(path: string) {
  const backup = validateBackupSnapshot(JSON.parse(await readBounded(path)))
  const { version: _version, exportedAt: _exportedAt, ...snapshot } = backup
  return boundedSnapshot(snapshot)
}
function summary(snapshot: Record<string, unknown>) {
  // Fixed schema names only: arbitrary extension fields must never become log output.
  const fields = ['theme', 'races', 'goals', 'activities', 'blockedDates', 'decisionLog', 'currentState', 'goalConversation', 'activeGoalId', 'account', 'visualization']
  return JSON.stringify(Object.fromEntries(fields.filter(k => Object.hasOwn(snapshot, k)).map(k => [k, Array.isArray(snapshot[k]) ? snapshot[k].length : 1])))
}
function argumentsFor(args: string[]) {
  const [command, file] = args
  if (command === 'schema' && args.length === 2 && file === '--confirm-schema') return { command }
  if ((command === 'preview' || command === 'backup') && args.length === 2 && file && !file.startsWith('--')) return { command, file }
  if (command === 'import-empty' && args.length === 3 && file && !file.startsWith('--') && args[2] === '--confirm-empty') return { command, file }
  if (command === 'restore' && file && !file.startsWith('--')) {
    const flags = new Map<string, string | true>()
    for (let i = 2; i < args.length; i++) {
      const flag = args[i]
      if (flags.has(flag)) failure()
      if (flag === '--confirm-restore') flags.set(flag, true)
      else if (flag === '--revision' || flag === '--backup-before') { const value = args[++i]; if (!value || value.startsWith('--')) failure(); flags.set(flag, value) }
      else failure()
    }
    const revision = flags.get('--revision'), before = flags.get('--backup-before')
    if (!flags.has('--confirm-restore') || typeof revision !== 'string' || !/^(0|[1-9]\d*)$/.test(revision) || !Number.isSafeInteger(Number(revision)) || Number(revision) >= Number.MAX_SAFE_INTEGER || typeof before !== 'string') failure()
    return { command, file, revision: Number(revision), before }
  }
  failure()
}

/** Import-safe library entry. A separate bundled CLI wrapper should call this and print generic errors. */
export async function runAdmin(args: string[], env: BackupEnvironment = process.env, dependencies: AdminDependencies = {}): Promise<void> {
  let pool: AdminPool | undefined
  try {
    const parsed = argumentsFor(args), output = dependencies.output ?? console.log
    if (parsed.command === 'preview') { output(summary(await plainSnapshot(parsed.file!))); return }
    const config = loadConfig(env)
    // Validate input/keys/paths before opening a database connection.
    const imported = parsed.command === 'import-empty' ? await plainSnapshot(parsed.file!) : undefined
    const restored = parsed.command === 'restore' ? decryptBackup(await readBounded(parsed.file!), config.ownerId, env) : undefined
    if (restored) restored.snapshot = boundedSnapshot(restored.snapshot)
    if (parsed.command === 'backup' || parsed.command === 'restore') await validateBackupPath(parsed.command === 'backup' ? parsed.file! : parsed.before!, config.staticDir)
    pool = dependencies.createPool ? dependencies.createPool(config.databaseUrl) : new pg.Pool({ connectionString: config.databaseUrl })
    const store: AdminStore = dependencies.createStore ? dependencies.createStore(pool, config.ownerId) : new PgStore(pool, config.ownerId)
    if (parsed.command === 'schema') { await store.initialize(); output('Schema initialized'); return }
    const current = await store.getState()
    if (parsed.command === 'import-empty') {
      if (current.revision !== 0 || current.snapshot !== null) failure()
      await store.saveState({ revision: 0, snapshot: imported, key: randomUUID() })
      output('Import complete'); return
    }
    if (current.snapshot === null || current.revision < 1) failure()
    if (parsed.command === 'backup') { await writeEncrypted(parsed.file!, current, config.ownerId, env, config.staticDir); output('Backup complete'); return }
    if (parsed.command === 'restore') {
      if (current.revision !== parsed.revision) failure()
      await writeEncrypted(parsed.before!, current, config.ownerId, env, config.staticDir)
      await store.saveState({ revision: parsed.revision!, snapshot: restored!.snapshot, key: randomUUID() })
      output('Restore complete'); return
    }
    failure()
  } catch { failure() } finally {
    if (pool) { try { await pool.end() } catch { failure() } }
  }
}
