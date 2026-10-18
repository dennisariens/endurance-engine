import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

describe('production startup', () => {
  it('refuses to start without required configuration and never echoes secrets', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', resolve('server/personal/start.ts')], { env: { PATH: process.env.PATH, NODE_ENV: 'production', DATABASE_URL: 'postgresql://private-secret@localhost/private' }, encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Personal Sync startup refused')
    expect(result.stderr).not.toContain('private-secret')
  })
})
