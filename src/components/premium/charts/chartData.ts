import type { Activity, CurrentState } from '../../../domain/types'
import type { GoalReadinessResult } from '../../../engine/goalReadinessEngine'
import type { Next72Plan } from '../../../engine/recoveryPlanEngine'
import type { DashboardStats } from '../../../engine/statsEngine'
import { clamp } from '../ui'

export type RaceCostPoint = { label: string; value: number }
export type LoadPoint = RaceCostPoint & { ctl: number; atl: number; tsb: number; cost: number }
export type DriftDurabilityPoint = { label: string; drift: number; durability: number }
export type ReadinessTrajectoryPoint = { label: string; readiness: number }
export type ReadinessSignalPoint = { label: string; value: number }
export type RecoveryLagPoint = { label: string; lag: number; risk: number }
export type StageCumulativePoint = { label: string; stages: number; cumulative: number }
export type HealthMetricPoint = { label: string; hr: number; hrv: number; sleep: number; vo2max: number; steps: number; readiness: number; recoveryTime: number }
export type ActivityHistoryPoint = { label: string; load: number; distanceKm: number; durationMin: number; avgHr: number; recoveryTime: number }

export function buildRaceCostTrend(stats: Pick<DashboardStats, 'raceCostSeries'>, state: CurrentState): RaceCostPoint[] {
  return stats.raceCostSeries.length ? stats.raceCostSeries : [{ label: 'Now', value: state.latest_race_cost ?? 0 }]
}

export function buildLoadSeries(raceCost: RaceCostPoint[], state: CurrentState): LoadPoint[] {
  return raceCost.map((item, index) => {
    const ctl = clamp(42 + index * 3 + Math.round((state.vo2max ?? 46) / 10), 20, 95)
    const atl = clamp(item.value + 12, 10, 110)
    return { label: item.label, value: item.value, ctl, atl, tsb: ctl - atl, cost: item.value }
  })
}

export function buildDriftDurabilitySeries(raceCost: RaceCostPoint[]): DriftDurabilityPoint[] {
  return raceCost.map((item, index) => ({
    label: item.label,
    drift: clamp(Math.round(item.value / 9 + index), 2, 18),
    durability: clamp(96 - item.value + index * 2, 35, 100),
  }))
}

export function buildReadinessTrajectory(readiness?: GoalReadinessResult): ReadinessTrajectoryPoint[] {
  return [0, 1, 2, 3, 4].map((week) => ({
    label: `W${week}`,
    readiness: clamp((readiness?.overallReadiness ?? 62) + week * 4 - (week === 1 ? 5 : 0), 0, 100),
  }))
}

export function buildReadinessSignals(state: CurrentState): ReadinessSignalPoint[] {
  return [
    { label: 'Training', value: state.garmin_training_readiness ?? state.recovery_score ?? 0 },
    { label: 'Battery', value: state.garmin_body_battery ?? state.recovery_score ?? 0 },
    { label: 'Sleep', value: state.garmin_sleep_score ?? state.sleep_score ?? 0 },
    { label: 'Stress', value: 100 - (state.garmin_stress_avg ?? 50) },
  ]
}

export function buildRecoveryLagSeries(next72Plan: Next72Plan): RecoveryLagPoint[] {
  return next72Plan.blocks.map((block, index) => ({
    label: block.horizon,
    lag: block.tone === 'red' ? 72 - index * 8 : block.tone === 'yellow' ? 36 - index * 5 : block.tone === 'blue' ? 24 : 12,
    risk: block.tone === 'red' ? 90 : block.tone === 'yellow' ? 55 : 25,
  }))
}

export function buildStageCumulativeSeries(stats: Pick<DashboardStats, 'weeklyRaceDensity'>): StageCumulativePoint[] {
  let cumulative = 0
  return stats.weeklyRaceDensity.map((item) => {
    cumulative += item.count
    return { label: item.label, stages: item.count, cumulative }
  })
}

export function buildActivityHistorySeries(activities: Activity[]): ActivityHistoryPoint[] {
  return [...activities]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((activity) => ({
      label: activity.date.slice(5),
      load: activity.load ?? activity.raceCost ?? 0,
      distanceKm: Math.round((activity.distanceM ?? 0) / 1000),
      durationMin: Math.round((activity.durationSec ?? 0) / 60),
      avgHr: activity.avgHr ?? 0,
      recoveryTime: activity.raceCostBand === 'Extreme' ? 72 : activity.raceCostBand === 'High' ? 48 : activity.raceCostBand === 'Medium' ? 24 : 12,
    }))
}

export function buildHealthMetricSeries(state: CurrentState): HealthMetricPoint[] {
  const hr = state.resting_hr_14d_avg ?? 50
  const hrv = state.hrv_14d_avg ?? 50
  const sleep = state.sleep_hours_14d_avg ?? 7.5
  const vo2max = state.vo2max ?? 48
  const steps = state.steps_7d_avg ?? 8_500
  const readiness = state.garmin_training_readiness ?? state.recovery_score ?? 55
  const recoveryTime = state.recovery_time_hours ?? (state.latest_race_cost_band === 'Extreme' ? 72 : state.latest_race_cost_band === 'High' ? 48 : 24)
  return [-5, -4, -3, -2, -1, 0].map((offset) => ({
    label: offset === 0 ? 'Now' : `${Math.abs(offset)}d`,
    hr: clamp(Math.round(hr + offset * -0.4), 35, 90),
    hrv: clamp(Math.round(hrv + offset * 0.8), 20, 120),
    sleep: Number(clamp(sleep + offset * 0.08, 3, 10).toFixed(1)),
    vo2max: Number(clamp(vo2max + offset * 0.05, 25, 80).toFixed(1)),
    steps: Number((clamp(steps + offset * 180, 1_000, 30_000) / 1000).toFixed(1)),
    readiness: clamp(Math.round(readiness + offset * 2), 0, 100),
    recoveryTime: clamp(Math.round(recoveryTime + offset * -2), 0, 96),
  }))
}

export function deriveTrainingStatus(state: CurrentState, activities: Activity[]): { label: string; tone: 'green' | 'yellow' | 'red' | 'blue' | 'slate'; detail: string } {
  const explicit = String(state.training_status ?? '').trim().toLowerCase()
  if (explicit) return { label: explicit, tone: toneForTrainingStatus(explicit), detail: 'From imported training status.' }
  const recentLoad = activities.slice(0, 5).reduce((sum, activity) => sum + (activity.load ?? activity.raceCost ?? 0), 0)
  const readiness = state.garmin_training_readiness ?? state.recovery_score ?? 55
  if (state.recovery_status === 'red' || recentLoad > 320) return { label: 'overreaching', tone: 'red', detail: 'High recent load or red recovery.' }
  if (readiness >= 75 && recentLoad >= 160) return { label: 'productive', tone: 'green', detail: 'Readiness supports the recent workload.' }
  if (readiness >= 70 && recentLoad < 120) return { label: 'fresh', tone: 'blue', detail: 'Low recent load with usable readiness.' }
  if (recentLoad < 70) return { label: 'detraining', tone: 'yellow', detail: 'Low recent load trend.' }
  return { label: 'maintaining', tone: 'slate', detail: 'Load and readiness are balanced.' }
}

function toneForTrainingStatus(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'slate' {
  if (status.includes('productive')) return 'green'
  if (status.includes('over')) return 'red'
  if (status.includes('fresh')) return 'blue'
  if (status.includes('detrain')) return 'yellow'
  return 'slate'
}
