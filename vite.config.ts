import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from './src/engine/intervalsSyncEngine'

const DEFAULT_ATHLETE_ID = 'i478692'

function aerionSyncPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'aerion-opening-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const apiKey = env.INTERVALS_ICU_API_KEY || process.env.INTERVALS_ICU_API_KEY
        const athleteId = env.INTERVALS_ICU_ATHLETE_ID || process.env.INTERVALS_ICU_ATHLETE_ID || DEFAULT_ATHLETE_ID
        if (!apiKey) {
          res.end(JSON.stringify({ ok: false, source: 'unavailable', message: 'INTERVALS_ICU_API_KEY is not set; using local fixture/manual data only.' }))
          return
        }

        try {
          const newest = isoDate(offsetDate(30))
          const oldest = isoDate(offsetDate(-45))
          const auth = `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}`
          const headers = { Authorization: auth, Accept: 'application/json' }
          const [activityResponse, wellnessResponse, eventResponse] = await Promise.all([
            fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}&limit=200`, { headers }),
            fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/wellness?oldest=${oldest}&newest=${newest}`, { headers }),
            fetch(`https://intervals.icu/api/v1/athlete/${athleteId}/events?oldest=${isoDate(offsetDate(-7))}&newest=${newest}&resolve=true`, { headers }),
          ])

          if (!activityResponse.ok) throw new Error(`activities ${activityResponse.status}`)
          const activityRows = await activityResponse.json()
          const wellnessRows = wellnessResponse.ok ? await wellnessResponse.json() : []
          const eventRows = eventResponse.ok ? await eventResponse.json() : []
          const activities = normalizeIntervalsActivities(Array.isArray(activityRows) ? activityRows : [])
          const races = normalizeIntervalsEvents(Array.isArray(eventRows) ? eventRows : [])
          const state = normalizeIntervalsWellness(Array.isArray(wellnessRows) ? wellnessRows : [])
          res.end(JSON.stringify({
            ok: true,
            source: 'intervals',
            message: `Synced ${activities.length} activities and ${races.length} race events from Intervals.icu on opening.`,
            syncedAt: new Date().toISOString(),
            activities,
            races,
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), aerionSyncPlugin(env)],
  }
})
