import { describe, expect, it } from 'vitest'
import type { CurrentState } from '../../../domain/types'
import type { Next72Plan } from '../../../engine/recoveryPlanEngine'
import {
  buildDriftDurabilitySeries,
  buildLoadSeries,
  buildRaceCostTrend,
  buildReadinessSignals,
  buildReadinessTrajectory,
  buildRecoveryLagSeries,
  buildStageCumulativeSeries,
} from './chartData'

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'yellow',
  latest_race_cost: 74,
  vo2max: 49,
  garmin_training_readiness: 52,
  garmin_body_battery: 44,
  garmin_sleep_score: 81,
  garmin_stress_avg: 37,
}

const next72Plan: Next72Plan = {
  summary: 'Recovery audit active.',
  risk: 'High',
  blocks: [
    { horizon: 'Today', date: '2026-06-09', action: 'Recover', allowedWork: [], hardLimits: [], why: 'High debt', tone: 'red' },
    { horizon: '+24h', date: '2026-06-10', action: 'Easy only', allowedWork: [], hardLimits: [], why: 'Hold', tone: 'yellow' },
    { horizon: '+48h', date: '2026-06-11', action: 'Race proximity', allowedWork: [], hardLimits: [], why: 'Fixed race', tone: 'blue' },
    { horizon: '+72h', date: '2026-06-12', action: 'Build', allowedWork: [], hardLimits: [], why: 'Clear', tone: 'green' },
  ],
}

describe('premium chart data helpers', () => {
  it('builds fallback race cost and derived performance series', () => {
    const raceCost = buildRaceCostTrend({ raceCostSeries: [] }, state)
    const load = buildLoadSeries(raceCost, state)
    const drift = buildDriftDurabilitySeries(raceCost)

    expect(raceCost).toEqual([{ label: 'Now', value: 74 }])
    expect(load[0]).toMatchObject({ label: 'Now', atl: 86, cost: 74 })
    expect(load[0].tsb).toBe(load[0].ctl - load[0].atl)
    expect(drift[0]).toEqual({ label: 'Now', drift: 8, durability: 35 })
  })

  it('builds readiness, recovery lag, and race block series', () => {
    expect(buildReadinessTrajectory({ overallReadiness: 61 } as never).map((point) => point.readiness)).toEqual([61, 60, 69, 73, 77])
    expect(buildReadinessSignals(state)).toEqual([
      { label: 'Training', value: 52 },
      { label: 'Battery', value: 44 },
      { label: 'Sleep', value: 81 },
      { label: 'Stress', value: 63 },
    ])
    expect(buildRecoveryLagSeries(next72Plan).map((point) => point.risk)).toEqual([90, 55, 25, 25])
    expect(buildStageCumulativeSeries({ weeklyRaceDensity: [{ label: '+0-6d', count: 2 }, { label: '+7-13d', count: 1 }] })).toEqual([
      { label: '+0-6d', stages: 2, cumulative: 2 },
      { label: '+7-13d', stages: 1, cumulative: 3 },
    ])
  })
})
