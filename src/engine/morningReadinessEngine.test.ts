import { describe, expect, it } from 'vitest'
import type { CurrentState } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import type { ActualOverride } from './actualOverrideEngine'
import { buildMorningReadinessVerdict } from './morningReadinessEngine'

const baseOverride: ActualOverride = {
  status: 'actual-overrides-log',
  authoritativeSource: 'completed-activity',
  severity: 'red',
  headline: 'Completed activity overrides the plan/log.',
  plannedSummary: 'Rest · 0 min',
  loggedSummary: 'Rest · 0 min · scenario-rest',
  actualSummary: 'ECRO Zwift Race · 70 min · load 108',
  deltaSummary: 'Rest logged, but actual work exists. Completed work overrides intent.',
  tomorrowImpact: 'Tomorrow should recalculate from completed load.',
}

const readyState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  hrv_14d_avg: 52,
  sleep_hours_14d_avg: 8,
  resting_hr_14d_avg: 48,
  garmin_body_battery: 82,
  garmin_training_readiness: 74,
  garmin_sleep_score: 86,
  garmin_stress_avg: 18,
  garmin_hrv_status: 'balanced',
}

describe('buildMorningReadinessVerdict', () => {
  it('recovers when yesterday was hard and Garmin readiness is poor', () => {
    const verdict = buildMorningReadinessVerdict({
      today: '2026-05-09',
      state: {
        ...readyState,
        recovery_status: 'red',
        garmin_body_battery: 22,
        garmin_training_readiness: 28,
        garmin_sleep_score: 52,
        garmin_stress_avg: 61,
        garmin_hrv_status: 'low',
      },
      yesterdayOverride: baseOverride,
    })

    expect(verdict.verdict).toBe('Recover')
    expect(verdict.forwardState).toBe('extend')
    expect(verdict.primaryAction).toContain('Recovery day')
    expect(verdict.reasons.some((reason) => reason.includes('yesterday'))).toBe(true)
    expect(verdict.signals.some((signal) => signal.label === 'Body Battery' && signal.status === 'red')).toBe(true)
  })

  it('modifies when yesterday was hard but readiness is usable', () => {
    const verdict = buildMorningReadinessVerdict({ today: '2026-05-09', state: readyState, yesterdayOverride: baseOverride })

    expect(verdict.verdict).toBe('Modify')
    expect(verdict.forwardState).toBe('hold')
    expect(verdict.primaryAction).toContain('easy')
  })

  it('proceeds when readiness is good and no completed override debt remains', () => {
    const verdict = buildMorningReadinessVerdict({
      today: '2026-05-09',
      state: readyState,
      yesterdayOverride: { ...baseOverride, status: 'actual-matches-log', severity: 'green', deltaSummary: 'Completed activity broadly matches logged intent.' },
    })

    expect(verdict.verdict).toBe('Proceed')
    expect(verdict.forwardState).toBe('clear')
    expect(verdict.primaryAction).toContain('Proceed')
  })

  it('accepts canonical athlete state as advisory evidence without replacing actuals-first readiness signals', () => {
    const athleteState = {
      freshness: { overall: 'stale' },
      recovery: { status: 'green', missingSignals: ['sleep'] },
      health: { injuryStatus: 'clear', illnessStatus: 'clear' },
    } as CanonicalAthleteState

    const verdict = buildMorningReadinessVerdict({
      today: '2026-05-09',
      state: readyState,
      athleteState,
    })

    expect(verdict.verdict).toBe('Proceed')
    expect(verdict.reasons).toContain('Canonical athlete state is stale; reduce confidence, preserve data, and keep the recommendation advisory.')
    expect(verdict.reasons).toContain('Missing canonical recovery signals: sleep.')
  })
})
