import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState } from '../../../domain/types'
import { buildActivityHistorySeries, buildDriftDurabilitySeries, buildHealthMetricSeries, buildLoadSeries, buildRaceCostTrend, buildReadinessSignals, buildReadinessTrajectory, buildRecoveryLagSeries, deriveTrainingStatus } from './chartData'

const state: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'unknown' }
describe('honest chart evidence', () => {
  it('does not invent historical series or forward numerical projections', () => {
    expect(buildLoadSeries([{ label: 'A', value: 80 }], state)).toEqual([])
    expect(buildDriftDurabilitySeries([{ label: 'A', value: 80 }])).toEqual([])
    expect(buildHealthMetricSeries({ ...state, hrv_14d_avg: 50 })).toEqual([])
    expect(buildReadinessTrajectory({ overallReadiness: 61 } as never)).toEqual([])
    expect(buildRecoveryLagSeries({ blocks: [{ tone: 'red' }] } as never)).toEqual([])
  })
  it('preserves zero and omits missing signals instead of substituting recovery', () => {
    expect(buildReadinessSignals({ ...state, recovery_score: 72 })).toEqual([])
    expect(buildReadinessSignals({ ...state, garmin_training_readiness: 0 })).toEqual([{ label: 'Training', value: 0 }])
    expect(buildRaceCostTrend({ raceCostSeries: [] }, state)).toEqual([])
    expect(buildRaceCostTrend({ raceCostSeries: [] }, { ...state, latest_race_cost: 0 })).toEqual([{ label: 'Latest reported', value: 0 }])
  })
  it('uses actual activity values and gaps rather than invented recovery estimates', () => {
    const values = buildActivityHistorySeries([{ id: 'synthetic', date: '2026-10-16', load: 0, distanceM: 0, durationSec: 0 } as Activity])
    expect(values[0]).toEqual({ label: '10-16', load: 0, distanceKm: 0, durationMin: 0, avgHr: null, recoveryTime: null })
    expect(deriveTrainingStatus(state, []).label).toBe('Unavailable')
  })
})
