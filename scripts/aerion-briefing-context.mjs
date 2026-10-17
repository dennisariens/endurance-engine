#!/usr/bin/env node
import { fetchBriefing, snapshotPathFromArgs } from './aerion-briefing-client.mjs'

try {
  const args = process.argv.slice(2)
  const dateArg = args.find(arg => arg.startsWith('--date='))
  const dateIndex = args.indexOf('--date')
  const date = dateArg ? dateArg.slice('--date='.length) : dateIndex >= 0 ? args[dateIndex + 1] || '' : undefined
  const payload = await fetchBriefing({ date, snapshotPath: snapshotPathFromArgs(args) })
  if (!payload.ok) {
    console.error(`${payload.code}: ${payload.message}`)
    process.exitCode = 1
  } else console.log(JSON.stringify(payload, null, 2))
} catch {
  console.error('INVALID_ARGUMENTS: Use --snapshot FILE (or AERION_SNAPSHOT_PATH) and optional --date YYYY-MM-DD.')
  process.exitCode = 1
}
