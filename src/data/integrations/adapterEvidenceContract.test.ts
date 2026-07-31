import { describe, expect, it } from 'vitest'
import type { CurrentState, Goal, Race } from '../../domain/types'
import { buildEvidenceRecords } from '../evidence'
import { buildFreshnessReport } from '../freshness'
import { normalizeGarminRecoveryState } from './garminRecoveryAdapter'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from './intervalsAdapter'
import { normalizeStravaActivityProofs } from './stravaActivityProofAdapter'

const races: Race[] = [{ id: 'race-fixed', date: '2026-08-15', name: 'Fixed A-race', discipline: 'cycling', priority: 'fixed', mandatory: true }]
const goals: Goal[] = [{ id: 'goal-a', name: 'Race-ready', type: 'fixed-date-race', discipline: 'cycling', status: 'committed', targetDate: '2026-08-15', priority: 'high' }]
const baseState: CurrentState = { last_updated: '2026-07-31', injury_present: false, illness_present: false, recovery_status: 'green' }

function buildEvidenceFromAdapters(state: CurrentState) {
  const intervalsActivities = normalizeIntervalsActivities([
    { id: 'int-1', start_date_local: '2026-07-29T07:00:00Z', name: 'Intervals load', type: 'Ride', moving_time: 3600, distance: 42000, icu_training_load: 82 },
  ])
  const stravaActivities = normalizeStravaActivityProofs([
    { id: 9, start_date_local: '2026-07-30T08:00:00Z', name: 'Strava proof', sport_type: 'Ride', moving_time: 1800, distance: 21000, suffer_score: 38 },
  ])
  const intervalsRaces = normalizeIntervalsEvents([
    { id: 'event-1', start_date_local: '2026-08-15T09:00:00Z', name: 'ECRO race', type: 'Ride', distance: 91000 },
  ])
  const activities = [...intervalsActivities, ...stravaActivities]
  const allRaces = [...races, ...intervalsRaces]
  const freshness = buildFreshnessReport({ today: '2026-07-31', state, activities, races: allRaces, syncedAt: '2026-07-31T08:00:00.000Z' })
  return buildEvidenceRecords({ athleteId: 'dennis', generatedAt: '2026-07-31T09:00:00.000Z', state, activities, races: allRaces, goals, freshness })
}

describe('adapter-to-evidence contract', () => {
  it('turns Intervals, Strava, Garmin, races, goals, and freshness into traceable evidence IDs', () => {
    const intervalsState = normalizeIntervalsWellness([{ id: '2026-07-31', restingHR: 47, hrv: 64, sleepSecs: 28800, trainingReadiness: 72 }])
    const garminState = normalizeGarminRecoveryState({ date: '2026-07-31', hrv7dAvgMs: 65, restingHr7dAvg: 46, sleepHours: 8, trainingReadiness: 74 })
    const state: CurrentState = { ...baseState, ...intervalsState, ...garminState }

    const evidence = buildEvidenceFromAdapters(state)
    const ids = evidence.map((record) => record.id)

    expect(ids).toEqual(expect.arrayContaining([
      'activity:intervals:intervals-int-1',
      'activity:strava:strava-9',
      'race:race-fixed',
      'race:intervals-event-event-1',
      'goal:goal-a',
      'freshness:2026-07-31',
    ]))
    expect(evidence.every((record) => record.confidence >= 0 && record.confidence <= 1)).toBe(true)
    expect(evidence.filter((record) => record.kind === 'activity').map((record) => record.source)).toEqual(['intervals', 'strava'])
  })

  it('marks stale adapter-derived state as reduced-quality evidence without deleting records', () => {
    const state: CurrentState = { ...baseState, last_updated: '2026-06-01', recovery_status: 'yellow', resting_hr_14d_avg: 50, hrv_14d_avg: 58 }

    const evidence = buildEvidenceFromAdapters(state)
    const stateEvidence = evidence.find((record) => record.kind === 'state')

    expect(stateEvidence).toMatchObject({ kind: 'state', quality: 'stale' })
    expect(evidence.length).toBeGreaterThan(0)
  })
})
