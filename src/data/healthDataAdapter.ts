import type { CurrentState, StateFieldEvidence } from '../domain/types'
import { mergeRecoveryEvidence } from './coachingProvenance'
import { observationTime } from './recoveryEvidence'

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
  vo2max?: number | null
}

export type NormalizedHealthMetrics = {
  fieldEvidence?: Record<string, StateFieldEvidence>
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
  vo2max?: number | null
  sources: HealthDataSource[]
}

const sourcePriority: HealthDataSource[] = ['garmin', 'apple-health', 'google-fit', 'intervals', 'strava', 'manual']

function firstAvailable<T>(samples: RawHealthSample[], selector: (sample: RawHealthSample) => T | null | undefined): T | null {
  for (const sample of samples) {
    const value = selector(sample)
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
  const ordered = [...samples].sort((a, b) => (observationTime(b.date) ?? -Infinity) - (observationTime(a.date) ?? -Infinity) || sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source))
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
    vo2max: firstAvailable(ordered, (sample) => sample.vo2max),
    sources: [...new Set(ordered.map((sample) => sample.source))],
  }

  const selectors: Record<string, (sample: RawHealthSample) => unknown> = {
    hrvMs: sample => sample.hrv7dAvgMs ?? sample.hrvMs,
    hrvTrend: sample => sample.hrvTrend,
    restingHr: sample => sample.restingHr14dAvg ?? sample.restingHr7dAvg ?? sample.restingHr,
    sleepHours: sample => sample.sleepHours, sleepScore: sample => sample.sleepScore,
    bodyWeightKg: sample => sample.bodyWeightKg, bodyBattery: sample => sample.bodyBattery,
    stressAvg: sample => sample.stressAvg, trainingReadiness: sample => sample.trainingReadiness,
    hrvStatus: sample => sample.hrvStatus, recoveryScore: sample => sample.recoveryScore, vo2max: sample => sample.vo2max,
  }
  metrics.fieldEvidence = {}
  for (const [field, selector] of Object.entries(selectors)) {
    const sample = ordered.find(sample => selector(sample) != null)
    if (sample) metrics.fieldEvidence[field] = { observedAt: sample.date, source: sample.source, quality: 'reported' }
  }
  if (metrics.recoveryScore == null) {
    metrics.recoveryScore = deriveRecoveryScore(metrics)
    const components = ['sleepScore', 'bodyBattery', 'trainingReadiness', 'stressAvg', ...(metrics.hrvTrend !== 'unknown' ? ['hrvTrend'] : [])]
      .map(field => metrics.fieldEvidence?.[field]).filter((entry): entry is StateFieldEvidence => Boolean(entry))
    const dated = components.every(entry => observationTime(entry.observedAt) !== undefined)
    if (metrics.recoveryScore != null) metrics.fieldEvidence.recoveryScore = { source: 'derived', quality: 'derived', observedAt: dated ? components.map(entry => entry.observedAt!).sort((a, b) => observationTime(a)! - observationTime(b)!)[0] : undefined }
  }
  return metrics
}

export function mergeHealthIntoCurrentState(current: CurrentState, metrics: NormalizedHealthMetrics): CurrentState {
  const mapping = {
    resting_hr_14d_avg: 'restingHr', hrv_14d_avg: 'hrvMs', hrv_trend: 'hrvTrend',
    sleep_hours_14d_avg: 'sleepHours', sleep_score: 'sleepScore', recovery_score: 'recoveryScore',
    body_weight_kg: 'bodyWeightKg', garmin_body_battery: 'bodyBattery', garmin_stress_avg: 'stressAvg',
    garmin_training_readiness: 'trainingReadiness', garmin_sleep_score: 'sleepScore', garmin_hrv_status: 'hrvStatus', vo2max: 'vo2max',
  } as const
  const incoming: Partial<CurrentState> = { field_evidence: {} }
  for (const [field, metric] of Object.entries(mapping)) {
    if (metrics[metric] == null) continue
    Object.assign(incoming, { [field]: metrics[metric] })
    Object.assign(incoming.field_evidence!, { [field]: metrics.fieldEvidence?.[metric] ?? { observedAt: metrics.date, source: metrics.sources[0] ?? 'legacy-local', quality: 'reported' } })
  }
  return mergeRecoveryEvidence(current, incoming)
}
