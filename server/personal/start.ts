import { createServer } from 'node:http'
import pg from 'pg'
import { createApp, loadConfig } from './http'
import { PgStore } from './store.mjs'

async function main() {
  const config = loadConfig(process.env)
  const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000 })
  pool.on('error', () => { console.error('Personal Sync database connection unavailable.') })
  const store = new PgStore(pool, config.ownerId)
  // Schema changes are a separate, explicit owner operation. A missing schema
  // prevents startup; no production migration or owner data is auto-created.
  await store.getState()
  const server = createServer({ requestTimeout: 15000, headersTimeout: 10000, maxHeaderSize: 16384 }, createApp({ config, store }))
  server.maxRequestsPerSocket = 100
  const rawPort = process.env.PORT ?? '3000'
  if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) throw new Error('Invalid port')
  server.listen(Number(rawPort), '127.0.0.1', () => { console.log('Personal Sync backend listening.') })
  server.on('error', () => { console.error('Personal Sync listener unavailable.'); process.exit(1) })
  const stop = () => { server.close(() => { void pool.end().finally(() => process.exit(0)) }); setTimeout(() => process.exit(1), 10000).unref() }
  process.once('SIGTERM', stop); process.once('SIGINT', stop)
}
main().catch(() => { console.error('Personal Sync startup refused; verify private configuration, schema and database availability.'); process.exit(1) })
