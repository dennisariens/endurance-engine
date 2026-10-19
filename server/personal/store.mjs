import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

function failure(status, message) {
  return Object.assign(new Error(message), { status })
}
function envelope(row) {
  return {
    revision: Number(row.revision),
    snapshot: row.snapshot,
    updatedAt: row.updated_at == null ? null : new Date(row.updated_at).toISOString(),
  }
}

export class PgStore {
  constructor(pool, ownerId) {
    if (typeof ownerId !== 'string' || !ownerId.trim()) throw failure(400, 'Invalid owner')
    this.pool = pool
    this.ownerId = ownerId
  }

  // No constructor/startup side effects. Run via the explicit migration command.
  async initialize() {
    const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
    await this.transaction(async client => {
      // Serializes concurrent explicit migrators, including initial table creation.
      await client.query('SELECT pg_advisory_xact_lock(1095062089, 1)')
      await client.query(schema)
      await client.query('INSERT INTO aerion_owner_state (owner_id) VALUES ($1) ON CONFLICT (owner_id) DO NOTHING', [this.ownerId])
    })
  }

  async transaction(action) {
    let client
    try {
      client = await this.pool.connect()
      await client.query('BEGIN')
      const result = await action(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {})
      if (error?.status === 409) throw failure(409, 'State conflict')
      throw failure(503, 'Persistence unavailable')
    } finally {
      client?.release()
    }
  }

  async query(text, values) {
    try {
      return await this.pool.query(text, values)
    } catch {
      throw failure(503, 'Persistence unavailable')
    }
  }

  async getState() {
    const { rows } = await this.query('SELECT revision, snapshot, updated_at FROM aerion_owner_state WHERE owner_id = $1', [this.ownerId])
    if (!rows[0]) throw failure(503, 'Persistence unavailable')
    return envelope(rows[0])
  }

  async saveState({ revision, snapshot, key }) {
    if (!Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER
      || typeof key !== 'string' || !key.length || key.length > 256 || snapshot === undefined) {
      throw failure(400, 'Invalid state request')
    }
    let serialized
    let snapshotJson
    try {
      serialized = JSON.stringify({ revision, snapshot })
      snapshotJson = JSON.stringify(snapshot)
      if (snapshotJson === undefined) throw new Error('Invalid JSON')
    } catch {
      throw failure(400, 'Invalid state request')
    }
    const hash = createHash('sha256').update(serialized).digest('hex')
    return this.transaction(async client => {
      const { rows } = await client.query('SELECT revision FROM aerion_owner_state WHERE owner_id = $1 FOR UPDATE', [this.ownerId])
      if (!rows[0]) throw failure(503, 'Persistence unavailable')
      const replay = await client.query('SELECT payload_hash, result FROM aerion_state_requests WHERE owner_id = $1 AND idempotency_key = $2', [this.ownerId, key])
      if (replay.rows[0]) {
        if (replay.rows[0].payload_hash !== hash) throw failure(409, 'State conflict')
        return replay.rows[0].result
      }
      if (Number(rows[0].revision) !== revision) throw failure(409, 'State conflict')
      const saved = await client.query(`UPDATE aerion_owner_state
        SET revision = revision + 1, snapshot = $2::jsonb, updated_at = clock_timestamp()
        WHERE owner_id = $1 RETURNING revision, snapshot, updated_at`, [this.ownerId, snapshotJson])
      const result = envelope(saved.rows[0])
      await client.query(`INSERT INTO aerion_state_requests (owner_id, idempotency_key, payload_hash, result)
        VALUES ($1, $2, $3, $4::jsonb)`, [this.ownerId, key, hash, JSON.stringify(result)])
      return result
    })
  }

  async createSession({ tokenHash, csrfToken, authenticated, expiresAt }) {
    const expiry = new Date(expiresAt)
    if (typeof tokenHash !== 'string' || !tokenHash || typeof csrfToken !== 'string' || !csrfToken
      || typeof authenticated !== 'boolean' || !Number.isFinite(expiry.getTime())) {
      throw failure(400, 'Invalid session request')
    }
    await this.query(`INSERT INTO aerion_sessions (owner_id, token_hash, csrf_token, authenticated, expires_at)
      VALUES ($1, $2, $3, $4, $5)`, [this.ownerId, tokenHash, csrfToken, authenticated, expiry.toISOString()])
  }

  async getSession(tokenHash) {
    const { rows } = await this.query(`SELECT csrf_token, authenticated, expires_at FROM aerion_sessions
      WHERE owner_id = $1 AND token_hash = $2 AND expires_at > clock_timestamp()`, [this.ownerId, tokenHash])
    const row = rows[0]
    return row ? { csrfToken: row.csrf_token, authenticated: row.authenticated, expiresAt: new Date(row.expires_at).toISOString() } : null
  }

  async deleteSession(tokenHash) {
    await this.query('DELETE FROM aerion_sessions WHERE owner_id = $1 AND token_hash = $2', [this.ownerId, tokenHash])
  }
}
