import type { CurrentState } from '../domain/types'

export type HealthDataSource = 'garmin' | 'strava' | 'intervals' | 'manual' | 'apple-health' | 'google-fit'

export type RawHealthSample = {
  source: HealthDataSource
  date?: string
  hrvMs?: number | null
  hrv7dAvgMs?: number | null
  hrvTrend?: 'improving' | 'stable' | 'declining' | 'unknown' | null
  restingHr?: number | null
  restingHr7dAvg?: number | null
  restingHr14dAvg?: number | null
  sleepHours?: number | null
  sleepScore?: number | null
  bodyWeightKg?: number | null
  bodyBattery?: number | null
  stressAvg?: number | null
  trainingReadiness?: number | null
  hrvStatus?: string | null
  recoveryScore?: number | null
}

export type NormalizedHealthMetrics = {
  date?: string
  hrvMs?: number | null
  hrvTrend?: 'improving' | 'stable' | 'declining' | 'unknown' | null
  restingHr?: number | null
  sleepHours?: number | null
  sleepScore?: number | null
  bodyWeightKg?: number | null
  bodyBattery?: number | null
  stressAvg?: number | null
  trainingReadiness?: number | null
  hrvStatus?: string | null
  recoveryScore?: number | null
  sources: HealthDataSource[]
}

const sourcePriority: HealthDataSource[] = ['garmin', 'apple-health', 'google-fit', 'intervals', 'strava', 'manual']

function firstAvailable<T>(samples: RawHealthSample[], selector: (sample: RawHealthSample) => T | null | undefined): T | null {
  for (const source of sourcePriority) {
    const sample = samples.find((item) => item.source === source)
    const value = sample ? selector(sample) : undefined
    if (value !== undefined && value !== null) return value
  }
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function deriveRecoveryScore(input: {
  hrvTrend?: NormalizedHealthMetrics['hrvTrend']
  sleepScore?: number | null
  bodyBattery?: number | null
  stressAvg?: number | null
  trainingReadiness?: number | null
}): number | null {
  const parts: number[] = []
  if (typeof input.sleepScore === 'number') parts.push(clamp(input.sleepScore, 0, 100))
  if (typeof input.bodyBattery === 'number') parts.push(clamp(input.bodyBattery, 0, 100))
  if (typeof input.trainingReadiness === 'number') parts.push(clamp(input.trainingReadiness, 0, 100))
  if (typeof input.stressAvg === 'number') parts.push(clamp(100 - input.stressAvg, 0, 100))
  if (input.hrvTrend && input.hrvTrend !== 'unknown') {
    parts.push(input.hrvTrend === 'improving' ? 80 : input.hrvTrend === 'stable' ? 65 : 35)
  }
  if (parts.length === 0) return null
  return Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length)
}

export function normalizeHealthData(samples: RawHealthSample[]): NormalizedHealthMetrics {
  const ordered = [...samples].sort((a, b) => sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source))
  const metrics: NormalizedHealthMetrics = {
    date: firstAvailable(ordered, (sample) => sample.date) ?? undefined,
    hrvMs: firstAvailable(ordered, (sample) => sample.hrv7dAvgMs ?? sample.hrvMs),
    hrvTrend: firstAvailable(ordered, (sample) => sample.hrvTrend),
    restingHr: firstAvailable(ordered, (sample) => sample.restingHr14dAvg ?? sample.restingHr7dAvg ?? sample.restingHr),
    sleepHours: firstAvailable(ordered, (sample) => sample.sleepHours),
    sleepScore: firstAvailable(ordered, (sample) => sample.sleepScore),
    bodyWeightKg: firstAvailable(ordered, (sample) => sample.bodyWeightKg),
    bodyBattery: firstAvailable(ordered, (sample) => sample.bodyBattery),
    stressAvg: firstAvailable(ordered, (sample) => sample.stressAvg),
    trainingReadiness: firstAvailable(ordered, (sample) => sample.trainingReadiness),
    hrvStatus: firstAvailable(ordered, (sample) => sample.hrvStatus),
    recoveryScore: firstAvailable(ordered, (sample) => sample.recoveryScore),
    sources: [...new Set(ordered.map((sample) => sample.source))],
  }

  metrics.recoveryScore ??= deriveRecoveryScore(metrics)
  return metrics
}

export function mergeHealthIntoCurrentState(current: CurrentState, metrics: NormalizedHealthMetrics): CurrentState {
  return {
    ...current,
    last_updated: metrics.date ?? current.last_updated,
    resting_hr_14d_avg: metrics.restingHr ?? current.resting_hr_14d_avg,
    hrv_14d_avg: metrics.hrvMs ?? current.hrv_14d_avg,
    hrv_trend: metrics.hrvTrend ?? current.hrv_trend,
    sleep_hours_14d_avg: metrics.sleepHours ?? current.sleep_hours_14d_avg,
    sleep_score: metrics.sleepScore ?? current.sleep_score,
    recovery_score: metrics.recoveryScore ?? current.recovery_score,
    body_weight_kg: metrics.bodyWeightKg ?? current.body_weight_kg,
    garmin_body_battery: metrics.bodyBattery ?? current.garmin_body_battery,
    garmin_stress_avg: metrics.stressAvg ?? current.garmin_stress_avg,
    garmin_training_readiness: metrics.trainingReadiness ?? current.garmin_training_readiness,
    garmin_sleep_score: metrics.sleepScore ?? current.garmin_sleep_score,
    garmin_hrv_status: metrics.hrvStatus ?? current.garmin_hrv_status,
  }
}
