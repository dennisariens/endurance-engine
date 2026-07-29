import type { CurrentState } from '../../domain/types'
import type { RawHealthSample } from '../healthDataAdapter'
import type { RecoverySnapshotAdapter } from './types'

export type GarminRecoverySnapshot = {
  date?: string
  hrvMs?: number | null
  hrv7dAvgMs?: number | null
  hrvStatus?: string | null
  restingHr?: number | null
  restingHr7dAvg?: number | null
  restingHr14dAvg?: number | null
  sleepHours?: number | null
  sleepSeconds?: number | null
  sleepScore?: number | null
  bodyBattery?: number | null
  stressAvg?: number | null
  trainingReadiness?: number | null
  recoveryScore?: number | null
  recoveryTimeHours?: number | null
  recoveryTimeSeconds?: number | null
  steps?: number | null
  steps7dAvg?: number | null
  trainingStatus?: string | null
  vo2max?: number | null
}

export const garminRecoveryAdapter: RecoverySnapshotAdapter<GarminRecoverySnapshot> = {
  descriptor: {
    id: 'garmin',
    displayName: 'Garmin',
    scopes: ['recovery'],
    serverOnly: true,
    secretPolicy: 'no-client-secrets',
    role: 'recovery-snapshot',
  },
  normalizeSnapshot: normalizeGarminRecoverySnapshot,
  normalizeState: normalizeGarminRecoveryState,
}

export function normalizeGarminRecoverySnapshot(snapshot: GarminRecoverySnapshot): RawHealthSample {
  return {
    source: 'garmin',
    date: snapshot.date,
    hrvMs: finiteNumber(snapshot.hrvMs),
    hrv7dAvgMs: finiteNumber(snapshot.hrv7dAvgMs),
    hrvStatus: snapshot.hrvStatus ?? null,
    restingHr: finiteNumber(snapshot.restingHr),
    restingHr7dAvg: finiteNumber(snapshot.restingHr7dAvg),
    restingHr14dAvg: finiteNumber(snapshot.restingHr14dAvg),
    sleepHours: finiteNumber(snapshot.sleepHours) ?? secondsToHours(snapshot.sleepSeconds),
    sleepScore: finiteNumber(snapshot.sleepScore),
    bodyBattery: finiteNumber(snapshot.bodyBattery),
    stressAvg: finiteNumber(snapshot.stressAvg),
    trainingReadiness: finiteNumber(snapshot.trainingReadiness),
    recoveryScore: finiteNumber(snapshot.recoveryScore),
    vo2max: finiteNumber(snapshot.vo2max),
  }
}

export function normalizeGarminRecoveryState(snapshot: GarminRecoverySnapshot): Partial<CurrentState> {
  const sample = normalizeGarminRecoverySnapshot(snapshot)
  return {
    last_updated: sample.date,
    resting_hr_14d_avg: sample.restingHr14dAvg ?? sample.restingHr7dAvg ?? sample.restingHr ?? undefined,
    hrv_14d_avg: sample.hrv7dAvgMs ?? sample.hrvMs ?? undefined,
    sleep_hours_14d_avg: sample.sleepHours ?? undefined,
    sleep_score: sample.sleepScore ?? undefined,
    recovery_score: sample.recoveryScore ?? undefined,
    garmin_body_battery: sample.bodyBattery ?? undefined,
    garmin_stress_avg: sample.stressAvg ?? undefined,
    garmin_training_readiness: sample.trainingReadiness ?? undefined,
    garmin_sleep_score: sample.sleepScore ?? undefined,
    garmin_hrv_status: sample.hrvStatus ?? undefined,
    recovery_time_hours: finiteNumber(snapshot.recoveryTimeHours) ?? secondsToHours(snapshot.recoveryTimeSeconds) ?? undefined,
    steps_7d_avg: finiteNumber(snapshot.steps7dAvg) ?? finiteNumber(snapshot.steps) ?? undefined,
    training_status: snapshot.trainingStatus ?? undefined,
    vo2max: sample.vo2max ?? undefined,
  }
}

export function parseGarminRecoveryFixture(value: unknown): GarminRecoverySnapshot[] {
  const rows = Array.isArray(value) ? value : isObject(value) && Array.isArray(value.snapshots) ? value.snapshots : [value]
  return rows.filter(isObject).map((row) => ({
    date: stringValue(row.date),
    hrvMs: numberValue(row.hrvMs),
    hrv7dAvgMs: numberValue(row.hrv7dAvgMs),
    hrvStatus: stringValue(row.hrvStatus),
    restingHr: numberValue(row.restingHr),
    restingHr7dAvg: numberValue(row.restingHr7dAvg),
    restingHr14dAvg: numberValue(row.restingHr14dAvg),
    sleepHours: numberValue(row.sleepHours),
    sleepSeconds: numberValue(row.sleepSeconds),
    sleepScore: numberValue(row.sleepScore),
    bodyBattery: numberValue(row.bodyBattery),
    stressAvg: numberValue(row.stressAvg),
    trainingReadiness: numberValue(row.trainingReadiness),
    recoveryScore: numberValue(row.recoveryScore),
    recoveryTimeHours: numberValue(row.recoveryTimeHours),
    recoveryTimeSeconds: numberValue(row.recoveryTimeSeconds),
    steps: numberValue(row.steps),
    steps7dAvg: numberValue(row.steps7dAvg),
    trainingStatus: stringValue(row.trainingStatus),
    vo2max: numberValue(row.vo2max),
  }))
}

function secondsToHours(seconds: number | null | undefined): number | null {
  if (seconds === undefined || seconds === null) return null
  return Number((seconds / 3600).toFixed(1))
}

function finiteNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
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
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
