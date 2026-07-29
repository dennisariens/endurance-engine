import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { buildFreshnessReport } from './freshness'
import { buildEvidenceRecords } from './evidence'

const state: CurrentState = {
  last_updated: '2026-07-28',
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
}

const activities: Activity[] = [
  { id: 'manual-1', source: 'manual', date: '2026-07-28', name: 'Easy run', type: 'Run', load: 45 },
  { id: 'intervals-1', source: 'intervals', date: '2026-07-27', name: 'Ride', type: 'Ride', load: 60 },
]

const races: Race[] = [
  { id: 'amsterdam-marathon', date: '2026-10-18', name: 'Amsterdam Marathon', discipline: 'running', priority: 'fixed', mandatory: true },
]

const goals: Goal[] = [
  { id: 'sub-3', name: 'Amsterdam Marathon sub 3', type: 'fixed-date-race', discipline: 'running', status: 'committed', targetDate: '2026-10-18', priority: 'high' },
]

describe('evidence records', () => {
  it('normalizes activities, state, races, goals, and freshness into traceable records', () => {
    const freshness = buildFreshnessReport({ today: '2026-07-29', state, activities, races, syncedAt: '2026-07-29T08:00:00Z' })
    const records = buildEvidenceRecords({ athleteId: 'dennis', generatedAt: '2026-07-29T09:00:00.000Z', state, activities, races, goals, freshness })

    expect(records.map((record) => record.kind)).toEqual(['activity', 'activity', 'state', 'race', 'goal', 'freshness'])
    expect(records[0]).toMatchObject({ id: 'activity:manual:manual-1', source: 'manual', quality: 'verified' })
    expect(records[0].confidence).toBeGreaterThan(records[1].confidence)
    expect(records.find((record) => record.kind === 'race')?.id).toBe('race:amsterdam-marathon')
  })

  it('marks records stale when freshness says the source is stale', () => {
    const freshness = buildFreshnessReport({ today: '2026-07-29', state: { ...state, last_updated: '2026-04-30' }, activities: [], races: [], syncedAt: undefined })
    const records = buildEvidenceRecords({ athleteId: 'dennis', generatedAt: '2026-07-29T09:00:00.000Z', state: { ...state, last_updated: '2026-04-30' }, activities: [], races: [], goals: [], freshness })

    expect(records.find((record) => record.kind === 'state')?.quality).toBe('stale')
    expect(records.find((record) => record.kind === 'freshness')?.quality).toBe('missing')
  })
})
