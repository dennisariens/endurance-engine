import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import defaultActivities from './data/activities.json'
import defaultGoals from './data/goals.json'
import defaultRaces from './data/races.json'
import defaultState from './data/current-state.json'
import type { Activity, CurrentState, Goal, Race } from './src/domain/types'
import { buildAerionBriefingContext } from './src/engine/aerionBriefingContextEngine'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from './src/data/integrations/intervalsAdapter'

const DEFAULT_ATHLETE_ID = 'i478692'

type OpeningSyncPayload = {
  ok: boolean
  source: 'intervals' | 'unavailable'
  message: string
  syncedAt?: string
  activities?: Activity[]
  races?: Race[]
  state?: Partial<CurrentState>
}

function getIntervalsCredentials(env: Record<string, string>) {
  return {
    apiKey: env.INTERVALS_ICU_API_KEY || process.env.INTERVALS_ICU_API_KEY,
    athleteId: env.INTERVALS_ICU_ATHLETE_ID || process.env.INTERVALS_ICU_ATHLETE_ID || DEFAULT_ATHLETE_ID,
  }
}

async function fetchIntervalsContext(env: Record<string, string>): Promise<OpeningSyncPayload> {
  const { apiKey, athleteId } = getIntervalsCredentials(env)
  if (!apiKey) {
    return { ok: false, source: 'unavailable', message: 'INTERVALS_ICU_API_KEY is not set; using local fixture/manual data only.' }
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

    return {
      ok: true,
      source: 'intervals',
      message: `Synced ${activities.length} activities and ${races.length} race events from Intervals.icu on opening.`,
      syncedAt: new Date().toISOString(),
      activities,
      races,
      state,
    }
  } catch (error) {
    return {
      ok: false,
      source: 'unavailable',
      message: `Opening sync failed; using local data. ${error instanceof Error ? error.message : 'Unknown error'}`,
      syncedAt: new Date().toISOString(),
    }
  }
}

function aerionSyncPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'aerion-opening-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(await fetchIntervalsContext(env)))
      })

      server.middlewares.use('/api/briefing', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url ?? '', 'http://127.0.0.1')
          const date = url.searchParams.get('date') || isoDate(new Date())
          const sync = await fetchIntervalsContext(env)
          const useLive = sync.ok && sync.activities
          const payload = buildAerionBriefingContext({
            date,
            timezone: 'Europe/Amsterdam',
            activities: useLive ? sync.activities ?? [] : defaultActivities as Activity[],
            races: useLive && sync.races?.length ? sync.races : defaultRaces as Race[],
            goals: defaultGoals as Goal[],
            state: useLive ? { ...defaultState as CurrentState, ...sync.state } : defaultState as CurrentState,
            source: useLive ? 'local-live' : 'local-fixture',
          })
          res.end(JSON.stringify({ ok: true, sync: { source: sync.source, message: sync.message, syncedAt: sync.syncedAt }, ...payload }, null, 2))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : 'Unknown briefing error' }))
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
    base: './',
    plugins: [react(), aerionSyncPlugin(env)],
  }
})
