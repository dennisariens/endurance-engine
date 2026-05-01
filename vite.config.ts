import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { normalizeIntervalsActivities, normalizeIntervalsWellness } from './src/engine/intervalsSyncEngine'

function aerionSyncPlugin(): Plugin {
  return {
    name: 'aerion-opening-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const apiKey = process.env.INTERVALS_ICU_API_KEY
        if (!apiKey) {
          res.end(JSON.stringify({ ok: false, source: 'unavailable', message: 'INTERVALS_ICU_API_KEY is not set; using local fixture/manual data only.' }))
          return
        }

        try {
          const newest = isoDate(offsetDate(1))
          const oldest = isoDate(offsetDate(-21))
          const auth = `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}`
          const [activityResponse, wellnessResponse] = await Promise.all([
            fetch(`https://intervals.icu/api/v1/athlete/0/activities?oldest=${oldest}&newest=${newest}`, { headers: { Authorization: auth } }),
            fetch(`https://intervals.icu/api/v1/athlete/0/wellness?oldest=${oldest}&newest=${newest}`, { headers: { Authorization: auth } }),
          ])

          if (!activityResponse.ok) throw new Error(`activities ${activityResponse.status}`)
          const activityRows = await activityResponse.json()
          const wellnessRows = wellnessResponse.ok ? await wellnessResponse.json() : []
          const activities = normalizeIntervalsActivities(Array.isArray(activityRows) ? activityRows : [])
          const state = normalizeIntervalsWellness(Array.isArray(wellnessRows) ? wellnessRows : [])
          res.end(JSON.stringify({
            ok: true,
            source: 'intervals',
            message: `Synced ${activities.length} activities from Intervals.icu on opening.`,
            syncedAt: new Date().toISOString(),
            activities,
            state,
          }))
        } catch (error) {
          res.end(JSON.stringify({
            ok: false,
            source: 'unavailable',
            message: `Opening sync failed; using local data. ${error instanceof Error ? error.message : 'Unknown error'}`,
            syncedAt: new Date().toISOString(),
          }))
        }
      })
    },
  }
}

function offsetDate(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default defineConfig({
  plugins: [react(), aerionSyncPlugin()],
})
