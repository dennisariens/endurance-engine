import type { Activity, CurrentState, DecisionLogEntry, Goal, Race } from '../src/domain/types'
import { buildCoachingProvenance } from '../src/data/coachingProvenance'
import { buildAerionBriefingContext } from '../src/engine/aerionBriefingContextEngine'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from '../src/data/integrations/intervalsAdapter'
import { upsertEvidenceRecords } from './evidenceStore'

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
  evidenceDbPath?: string
  snapshot?: { activities: Activity[]; races: Race[]; goals: Goal[]; state: CurrentState; decisionLog?: DecisionLogEntry[]; activeGoalId?: string; syncedAt?: string }
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
    return { ok: false, source: 'unavailable', message: 'Intervals credentials are unavailable. Existing browser-local data is unchanged; no fixtures substituted.' }
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

export async function buildBriefingPayload({ date, timezone = 'Europe/Amsterdam', evidenceDbPath, snapshot, ...options }: BuildBriefingPayloadOptions) {
  // The browser owns edits, selected goals and decisions. A server-only fetch
  // cannot reproduce that state and must never masquerade as the in-app coach.
  if (!snapshot) return { ok: false as const, source: 'unavailable', message: 'A browser coaching snapshot is required. Use the in-app coach or POST the current snapshot; no fixture fallback.', control: undefined, evidenceStore: undefined }
  const provenance = buildCoachingProvenance({ today: date, ...snapshot })
  // This is a presentation boundary, not a new coaching-engine policy: do not
  // publish model-default prescriptions/projections as supported athlete data.
  if (provenance.status !== 'current') return {
    ok: false as const, source: 'browser-local', code: `COACHING_EVIDENCE_${provenance.status.toUpperCase()}`,
    message: 'Refresh or resolve browser recovery evidence before requesting a personalised briefing. Retained measurements are unchanged.',
    provenance, control: undefined, evidenceStore: undefined,
  }
  const payload = buildAerionBriefingContext({
    date,
    timezone,
    ...snapshot,
    source: 'browser-local',
  })
  const resolvedEvidenceDbPath = evidenceDbPath ?? options.env.AERION_EVIDENCE_DB_PATH
  const evidenceStore = resolvedEvidenceDbPath ? upsertEvidenceRecords(resolvedEvidenceDbPath, payload.control.evidence) : undefined
  return { ok: true as const, provenance, evidenceStore, ...payload }
}
