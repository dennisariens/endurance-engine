import type { Activity, CurrentState, Race } from '../../domain/types'
import type { TrainingLoadAdapter } from './types'

export type IntervalsActivitySummary = Record<string, unknown>
export type IntervalsWellnessSummary = Record<string, unknown>
export type IntervalsEventSummary = Record<string, unknown>

export const intervalsAdapter: TrainingLoadAdapter<IntervalsActivitySummary, IntervalsEventSummary, IntervalsWellnessSummary> = {
  descriptor: {
    id: 'intervals',
    displayName: 'Intervals.icu',
    scopes: ['activities', 'events', 'recovery'],
    serverOnly: true,
    secretPolicy: 'no-client-secrets',
    role: 'primary-training-load',
  },
  normalizeActivities: normalizeIntervalsActivities,
  normalizeEvents: normalizeIntervalsEvents,
  normalizeWellness: normalizeIntervalsWellness,
}

export function normalizeIntervalsActivities(rows: IntervalsActivitySummary[]): Activity[] {
  return rows.map((row) => {
    const id = stringValue(row.id) ?? stringValue(row.activity_id) ?? cryptoSafeId(row)
    const date = (stringValue(row.start_date_local) ?? stringValue(row.start_date) ?? stringValue(row.date) ?? '').slice(0, 10)
    return {
      id: `intervals-${id}`,
      source: 'intervals' as const,
      date,
      name: stringValue(row.name) ?? stringValue(row.type) ?? 'Intervals activity',
      type: stringValue(row.type) ?? 'Activity',
      durationSec: numberValue(row.moving_time) ?? numberValue(row.elapsed_time) ?? numberValue(row.duration),
      distanceM: numberValue(row.distance),
      load: numberValue(row.icu_training_load) ?? numberValue(row.training_load) ?? numberValue(row.load),
      avgHr: numberValue(row.average_heartrate) ?? numberValue(row.avg_hr),
      maxHr: numberValue(row.max_heartrate) ?? numberValue(row.max_hr),
      normalizedPower: numberValue(row.weighted_average_watts) ?? numberValue(row.normalized_power),
      avgPower: numberValue(row.average_watts) ?? numberValue(row.avg_power),
    }
  }).filter((activity) => activity.date)
}

export function normalizeIntervalsEvents(rows: IntervalsEventSummary[]): Race[] {
  return rows
    .map((row) => {
      const id = stringValue(row.id) ?? stringValue(row.event_id) ?? cryptoSafeId(row)
      const date = (stringValue(row.start_date_local) ?? stringValue(row.start_date) ?? stringValue(row.date) ?? '').slice(0, 10)
      const type = stringValue(row.type) ?? stringValue(row.sport) ?? ''
      const name = stringValue(row.name) ?? stringValue(row.title) ?? 'Intervals race'
      return {
        id: `intervals-event-${id}`,
        date,
        name,
        series: stringValue(row.series) ?? 'Intervals.icu',
        discipline: disciplineFromType(type),
        format: 'other' as const,
        priority: 'fixed' as const,
        mandatory: true,
        distanceKm: kmValue(row.distance) ?? numberValue(row.distance_km),
        elevationM: numberValue(row.total_elevation_gain) ?? numberValue(row.elevation) ?? numberValue(row.elevation_m),
        notes: 'Synced Intervals event',
      }
    })
    .filter((race) => race.date && isRaceLikeEvent(race.name))
}

export function normalizeIntervalsWellness(rows: IntervalsWellnessSummary[]): Partial<CurrentState> {
  const latest = [...rows]
    .filter((row) => stringValue(row.id) || stringValue(row.date))
    .sort((a, b) => (stringValue(b.id) ?? stringValue(b.date) ?? '').localeCompare(stringValue(a.id) ?? stringValue(a.date) ?? ''))[0]

  if (!latest) return {}
  const sleepSeconds = numberValue(latest.sleepSecs) ?? numberValue(latest.sleep_secs) ?? numberValue(latest.sleep)
  const sleepHours = sleepSeconds && sleepSeconds > 24 ? Number((sleepSeconds / 3600).toFixed(1)) : sleepSeconds
  return {
    last_updated: stringValue(latest.id) ?? stringValue(latest.date),
    resting_hr_14d_avg: numberValue(latest.restingHR) ?? numberValue(latest.resting_hr),
    hrv_14d_avg: numberValue(latest.hrv) ?? numberValue(latest.hrv_rmssd),
    sleep_hours_14d_avg: sleepHours,
    vo2max: numberValue(latest.vo2max) ?? numberValue(latest.vo2_max) ?? numberValue(latest.vo2Max),
    garmin_body_battery: numberValue(latest.bodyBattery) ?? numberValue(latest.body_battery) ?? numberValue(latest.bodyBatteryCharged),
    garmin_stress_avg: numberValue(latest.stressAvg) ?? numberValue(latest.stress_avg) ?? numberValue(latest.averageStress),
    garmin_training_readiness: numberValue(latest.trainingReadiness) ?? numberValue(latest.training_readiness) ?? numberValue(latest.trainingReadinessScore),
    garmin_sleep_score: numberValue(latest.sleepScore) ?? numberValue(latest.sleep_score),
    garmin_hrv_status: stringValue(latest.hrvStatus) ?? stringValue(latest.hrv_status),
  }
}

function disciplineFromType(type: string): Race['discipline'] {
  if (/run/i.test(type)) return 'running'
  if (/tri/i.test(type)) return 'triathlon'
  if (/ride|bike|cycling/i.test(type)) return 'cycling'
  return 'other'
}

function isRaceLikeEvent(name: string): boolean {
  return /race|racing|ecro|zwift racing league|criterium|crit|tt\b|time trial|gran fondo|stage/i.test(name)
}

function kmValue(value: unknown): number | undefined {
  const meters = numberValue(value)
  if (meters === undefined) return undefined
  return meters > 1000 ? Number((meters / 1000).toFixed(1)) : meters
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
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

function cryptoSafeId(row: IntervalsActivitySummary | IntervalsEventSummary): string {
  return [stringValue(row.start_date_local), stringValue(row.name), stringValue(row.type)].filter(Boolean).join('-') || `activity-${Date.now()}`
}
