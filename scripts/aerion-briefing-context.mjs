#!/usr/bin/env node

const dateArg = process.argv.find((arg) => arg.startsWith('--date='))
const date = dateArg ? dateArg.slice('--date='.length) : new Date().toISOString().slice(0, 10)
const baseUrl = process.env.AERION_BASE_URL || 'http://127.0.0.1:5174'
const url = `${baseUrl.replace(/\/$/, '')}/api/briefing?date=${encodeURIComponent(date)}`

try {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await response.text()
  if (!response.ok) {
    console.error(`AERION briefing endpoint failed: HTTP ${response.status}`)
    console.error(text)
    process.exit(1)
  }
  const payload = JSON.parse(text)
  if (!payload.ok) {
    console.error(payload.message || 'AERION briefing payload returned ok=false')
    process.exit(1)
  }
  console.log(JSON.stringify(payload, null, 2))
} catch (error) {
  console.error(`AERION briefing context unavailable at ${url}`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
