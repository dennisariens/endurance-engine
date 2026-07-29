import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { buildEvidenceRecords } from '../data/evidence'
import { buildFreshnessReport } from '../data/freshness'
import { buildCanonicalAthleteState } from './canonicalAthleteState'

const activities: Activity[] = [
  { id: 'run-1', source: 'intervals', date: '2026-07-28', name: 'Easy run', type: 'Run', distanceM: 12000, load: 58 },
  { id: 'run-2', source: 'manual', date: '2026-07-24', name: 'Long run', type: 'Run', distanceM: 24000, load: 110 },
  { id: 'ride-1', source: 'strava', date: '2026-07-20', name: 'Ride', type: 'Ride', load: 70 },
]

const races: Race[] = [
  { id: 'amsterdam-marathon', date: '2026-10-18', name: 'Amsterdam Marathon', discipline: 'running', priority: 'fixed', mandatory: true },
]

const goals: Goal[] = [
  { id: 'sub-3', name: 'Amsterdam Marathon sub 3', type: 'fixed-date-race', discipline: 'running', status: 'committed', targetDate: '2026-10-18', targetValue: 'sub 3', priority: 'high' },
]

function build(input?: Partial<CurrentState>) {
  const state: CurrentState = {
    last_updated: '2026-07-28',
    injury_present: false,
    illness_present: false,
    recovery_status: 'green',
    recovery_score: 82,
    vo2max: 55,
    hrv_14d_avg: 58,
    sleep_hours_14d_avg: 7.5,
    resting_hr_14d_avg: 47,
    ...input,
  }
  const freshness = buildFreshnessReport({ today: '2026-07-29', state, activities, races, syncedAt: '2026-07-29T08:00:00Z' })
  const evidence = buildEvidenceRecords({ athleteId: 'dennis', generatedAt: '2026-07-29T09:00:00.000Z', state, activities, races, goals, freshness })
  return buildCanonicalAthleteState({ athleteId: 'dennis', today: '2026-07-29', generatedAt: '2026-07-29T09:00:00.000Z', state, activities, races, goals, freshness, evidence })
}

describe('canonical athlete state', () => {
  it('builds a deterministic v2 draft state from evidence and current inputs', () => {
    const state = build()

    expect(state.stateVersion).toBe('canonical-athlete-state-v2-draft-1')
    expect(state.recovery).toMatchObject({ status: 'green', score: 82 })
    expect(state.fatigue.acuteLoad).toBe(168)
    expect(state.fatigue.chronicLoad).toBe(40)
    expect(state.activeGoal).toMatchObject({ goalId: 'sub-3', discipline: 'running', priority: 'A', target: { timeSeconds: 10800 } })
    expect(state.evidenceSummary.includedEvidenceIds).toContain('race:amsterdam-marathon')
  })

  it('keeps injury and illness as hard deterministic constraints', () => {
    const state = build({ injury_present: true, recovery_status: 'green' })

    expect(state.recovery.status).toBe('blocked')
    expect(state.health.injuryStatus).toBe('blocked')
    expect(state.upcomingConstraints.find((constraint) => constraint.id.startsWith('health:injury'))?.severity).toBe('hard')
  })

  it('reduces confidence and preserves stale warnings instead of deleting data', () => {
    const stale = build({ last_updated: '2026-04-30', hrv_14d_avg: null, sleep_hours_14d_avg: null, resting_hr_14d_avg: null, recovery_score: null })

    expect(stale.freshness.overall).toBe('stale')
    expect(stale.recovery.confidence).toBeLessThan(0.4)
    expect(stale.recovery.missingSignals).toEqual(['HRV', 'sleep', 'resting HR', 'recovery score'])
    expect(stale.evidenceSummary.warnings.length).toBeGreaterThan(0)
  })
})
