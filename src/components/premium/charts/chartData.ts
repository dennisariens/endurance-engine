import type { Activity, CurrentState } from '../../../domain/types'
import type { GoalReadinessResult } from '../../../engine/goalReadinessEngine'
import type { Next72Plan } from '../../../engine/recoveryPlanEngine'
import type { DashboardStats } from '../../../engine/statsEngine'

export type RaceCostPoint = { label: string; value: number }
export type LoadPoint = RaceCostPoint & { ctl: number; atl: number; tsb: number; cost: number }
export type DriftDurabilityPoint = { label: string; drift: number; durability: number }
export type ReadinessTrajectoryPoint = { label: string; readiness: number }
export type ReadinessSignalPoint = { label: string; value: number }
export type RecoveryLagPoint = { label: string; lag: number; risk: number }
export type StageCumulativePoint = { label: string; stages: number; cumulative: number }
export type HealthMetricPoint = { label: string; hr: number; hrv: number; sleep: number; vo2max: number; steps: number; readiness: number; recoveryTime: number }
export type ActivityHistoryPoint = { label: string; load: number | null; distanceKm: number | null; durationMin: number | null; avgHr: number | null; recoveryTime: null }

export function buildRaceCostTrend(stats: Pick<DashboardStats, 'raceCostSeries'>, state: CurrentState): RaceCostPoint[] {
  return stats.raceCostSeries.length ? stats.raceCostSeries : state.latest_race_cost == null ? [] : [{ label: 'Latest reported', value: state.latest_race_cost }]
}

// These histories were previously invented from unrelated scalar values. Until
// dated measured inputs exist, an empty series is the only honest presentation.
export function buildLoadSeries(_raceCost: RaceCostPoint[], _state: CurrentState): LoadPoint[] { return [] }
export function buildDriftDurabilitySeries(_raceCost: RaceCostPoint[]): DriftDurabilityPoint[] { return [] }
export function buildReadinessTrajectory(_readiness?: GoalReadinessResult): ReadinessTrajectoryPoint[] { return [] }
export function buildRecoveryLagSeries(_next72Plan: Next72Plan): RecoveryLagPoint[] { return [] }
export function buildHealthMetricSeries(_state: CurrentState): HealthMetricPoint[] { return [] }

export function buildReadinessSignals(state: CurrentState): ReadinessSignalPoint[] {
  const signals = [
    { label: 'Training', value: state.garmin_training_readiness },
    { label: 'Battery', value: state.garmin_body_battery },
    { label: 'Sleep', value: state.garmin_sleep_score ?? state.sleep_score },
    { label: 'Stress (inverted)', value: state.garmin_stress_avg == null ? undefined : 100 - state.garmin_stress_avg },
  ]
  return signals.filter((point): point is ReadinessSignalPoint => typeof point.value === 'number' && Number.isFinite(point.value))
}

export function buildStageCumulativeSeries(stats: Pick<DashboardStats, 'weeklyRaceDensity'>): StageCumulativePoint[] {
  let cumulative = 0
  return stats.weeklyRaceDensity.map((item) => {
    cumulative += item.count
    return { label: item.label, stages: item.count, cumulative }
  })
}

export function buildActivityHistorySeries(activities: Activity[]): ActivityHistoryPoint[] {
  return [...activities].sort((a, b) => a.date.localeCompare(b.date)).slice(-12).map((activity) => ({
    label: activity.date.slice(5),
    load: activity.load ?? null,
    distanceKm: activity.distanceM == null ? null : activity.distanceM / 1000,
    durationMin: activity.durationSec == null ? null : activity.durationSec / 60,
    avgHr: activity.avgHr ?? null,
    recoveryTime: null,
  }))
}

export function deriveTrainingStatus(state: CurrentState, _activities: Activity[]): { label: string; tone: 'green' | 'yellow' | 'red' | 'blue' | 'slate'; detail: string } {
  const explicit = String(state.training_status ?? '').trim()
  return explicit ? { label: explicit, tone: 'slate', detail: 'Imported training status; freshness depends on its source.' }
    : { label: 'Unavailable', tone: 'slate', detail: 'No measured training status supplied.' }
}
