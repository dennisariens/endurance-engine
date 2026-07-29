import type { Activity } from '../../domain/types'
import type { ActivityProofAdapter } from './types'

export type StravaActivityProof = {
  id?: string | number
  name?: string
  sport_type?: string
  type?: string
  start_date_local?: string
  start_date?: string
  moving_time?: number | string
  elapsed_time?: number | string
  distance?: number | string
  suffer_score?: number | string
  average_heartrate?: number | string
  max_heartrate?: number | string
  weighted_average_watts?: number | string
  average_watts?: number | string
}

export const stravaActivityProofAdapter: ActivityProofAdapter<StravaActivityProof> = {
  descriptor: {
    id: 'strava',
    displayName: 'Strava',
    scopes: ['activity-proof'],
    serverOnly: true,
    secretPolicy: 'no-client-secrets',
    role: 'activity-proof',
  },
  normalizeActivities: normalizeStravaActivityProofs,
}

export function normalizeStravaActivityProofs(rows: StravaActivityProof[]): Activity[] {
  return rows.map((row) => {
    const id = stringValue(row.id) ?? cryptoSafeId(row)
    const date = (stringValue(row.start_date_local) ?? stringValue(row.start_date) ?? '').slice(0, 10)
    return {
      id: `strava-${id}`,
      source: 'strava' as const,
      date,
      name: row.name?.trim() || 'Strava activity',
      type: row.sport_type ?? row.type ?? 'Activity',
      durationSec: numberValue(row.moving_time) ?? numberValue(row.elapsed_time),
      distanceM: numberValue(row.distance),
      load: numberValue(row.suffer_score),
      avgHr: numberValue(row.average_heartrate),
      maxHr: numberValue(row.max_heartrate),
      normalizedPower: numberValue(row.weighted_average_watts),
      avgPower: numberValue(row.average_watts),
    }
  }).filter((activity) => activity.date)
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function cryptoSafeId(row: StravaActivityProof): string {
  return [stringValue(row.start_date_local), row.name, row.sport_type ?? row.type].filter(Boolean).join('-') || `activity-${Date.now()}`
}
