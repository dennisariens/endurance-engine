import defaultActivities from '../data/activities.json'
import defaultGoals from '../data/goals.json'
import defaultRaces from '../data/races.json'
import defaultState from '../data/current-state.json'
import type { Activity, CurrentState, Goal, Race } from '../src/domain/types'
import { buildAerionBriefingContext } from '../src/engine/aerionBriefingContextEngine'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from '../src/data/integrations/intervalsAdapter'

export const DEFAULT_ATHLETE_ID = 'i478692'

export type OpeningSyncPayload = {
  ok: boolean
  source: 'intervals' | 'unavailable'
  message: string
  syncedAt?: string
  activities?: Activity[]
  races?: Race[]
  state?: Partial<CurrentState>
}

export type AerionApiEnv = Record<string, string | undefined>

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export type FetchIntervalsContextOptions = {
  env: AerionApiEnv
  fetchImpl?: FetchLike
  now?: Date
}

export type BuildBriefingPayloadOptions = FetchIntervalsContextOptions & {
  date: string
  timezone?: string
}

export function getIntervalsCredentials(env: AerionApiEnv) {
  return {
    apiKey: env.INTERVALS_ICU_API_KEY,
    athleteId: env.INTERVALS_ICU_ATHLETE_ID || DEFAULT_ATHLETE_ID,
  }
}

function offsetDate(now: Date, days: number): Date {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  return date
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function fetchIntervalsContext({ env, fetchImpl = fetch as FetchLike, now = new Date() }: FetchIntervalsContextOptions): Promise<OpeningSyncPayload> {
  const { apiKey, athleteId } = getIntervalsCredentials(env)
  if (!apiKey) {
    return { ok: false, source: 'unavailable', message: 'INTERVALS_ICU_API_KEY is not set; using local fixture/manual data only.' }
  }

  try {
    const newest = isoDate(offsetDate(now, 30))
    const oldest = isoDate(offsetDate(now, -45))
    const auth = `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}`
    const headers = { Authorization: auth, Accept: 'application/json' }
    const [activityResponse, wellnessResponse, eventResponse] = await Promise.all([
      fetchImpl(`https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}&limit=200`, { headers }),
      fetchImpl(`https://intervals.icu/api/v1/athlete/${athleteId}/wellness?oldest=${oldest}&newest=${newest}`, { headers }),
      fetchImpl(`https://intervals.icu/api/v1/athlete/${athleteId}/events?oldest=${isoDate(offsetDate(now, -7))}&newest=${newest}&resolve=true`, { headers }),
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

export async function buildBriefingPayload({ date, timezone = 'Europe/Amsterdam', ...options }: BuildBriefingPayloadOptions) {
  const sync = await fetchIntervalsContext(options)
  const useLive = sync.ok && sync.activities
  const payload = buildAerionBriefingContext({
    date,
    timezone,
    activities: useLive ? sync.activities ?? [] : defaultActivities as Activity[],
    races: useLive && sync.races?.length ? sync.races : defaultRaces as Race[],
    goals: defaultGoals as Goal[],
    state: useLive ? { ...defaultState as CurrentState, ...sync.state } : defaultState as CurrentState,
    source: useLive ? 'local-live' : 'local-fixture',
  })
  return { ok: true, sync: { source: sync.source, message: sync.message, syncedAt: sync.syncedAt }, ...payload }
}
