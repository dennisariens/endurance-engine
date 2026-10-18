import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { validateStateSnapshot } from '../../src/data/backupSnapshot'
import type { StateEnvelope } from './http'

export const MAX_BACKUP_BYTES = 8 * 1024 * 1024
export type BackupEnvironment = Record<string, string | undefined>
const format = 'aerion-personal-sync'
const algorithm = 'aes-256-gcm'
function invalid(): never { throw new Error('Invalid encrypted backup') }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid()
  return value as Record<string, unknown>
}
function exact(value: Record<string, unknown>, fields: string[]) {
  if (Object.keys(value).length !== fields.length || fields.some(k => !Object.hasOwn(value, k))) invalid()
}
function base64(value: unknown, length?: number): Buffer {
  if (typeof value !== 'string' || !value.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) invalid()
  const bytes = Buffer.from(value, 'base64')
  if (bytes.toString('base64') !== value || (length !== undefined && bytes.length !== length)) invalid()
  return bytes
}
function keyFrom(env: BackupEnvironment) { return base64(env.AERION_BACKUP_KEY, 32) }
function owner(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 256) invalid()
}
function validatePayload(input: unknown): StateEnvelope {
  const row = object(input)
  exact(row, ['revision', 'snapshot', 'updatedAt'])
  if (!Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || (row.revision as number) >= Number.MAX_SAFE_INTEGER) invalid()
  if (typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.updatedAt)) || new Date(row.updatedAt).toISOString() !== row.updatedAt) invalid()
  const snapshot = validateStateSnapshot(row.snapshot)
  return { revision: row.revision as number, snapshot, updatedAt: row.updatedAt }
}
function aad(ownerId: string) { return Buffer.from(JSON.stringify({ format, version: 1, algorithm, ownerId })) }

/** The environment must be supplied from protected process configuration, never request input. */
export function encryptBackup(input: unknown, ownerId: string, env: BackupEnvironment = process.env): string {
  try {
    owner(ownerId)
    const key = keyFrom(env)
    const payload = JSON.stringify(validatePayload(input))
    if (Buffer.byteLength(payload) > MAX_BACKUP_BYTES) invalid()
    const iv = randomBytes(12), cipher = createCipheriv(algorithm, key, iv)
    cipher.setAAD(aad(ownerId))
    const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
    const serialized = JSON.stringify({ format, version: 1, algorithm, ownerId, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') })
    if (Buffer.byteLength(serialized) > MAX_BACKUP_BYTES) invalid()
    return serialized
  } catch { invalid() }
}

export function decryptBackup(serialized: string, ownerId: string, env: BackupEnvironment = process.env): StateEnvelope {
  try {
    owner(ownerId)
    if (typeof serialized !== 'string' || Buffer.byteLength(serialized) > MAX_BACKUP_BYTES) invalid()
    const row = object(JSON.parse(serialized))
    exact(row, ['format', 'version', 'algorithm', 'ownerId', 'iv', 'tag', 'ciphertext'])
    if (row.format !== format || row.version !== 1 || row.algorithm !== algorithm || row.ownerId !== ownerId) invalid()
    const decipher = createDecipheriv(algorithm, keyFrom(env), base64(row.iv, 12))
    decipher.setAAD(aad(ownerId)); decipher.setAuthTag(base64(row.tag, 16))
    const plaintext = Buffer.concat([decipher.update(base64(row.ciphertext)), decipher.final()])
    return validatePayload(JSON.parse(plaintext.toString('utf8')))
  } catch { invalid() }
}
