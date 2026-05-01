import type { Activity, CurrentState } from '../domain/types'

export type IntervalsActivitySummary = Record<string, unknown>
export type IntervalsWellnessSummary = Record<string, unknown>

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
  }
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

function cryptoSafeId(row: IntervalsActivitySummary): string {
  return [stringValue(row.start_date_local), stringValue(row.name), stringValue(row.type)].filter(Boolean).join('-') || `activity-${Date.now()}`
}
