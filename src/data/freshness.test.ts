import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Race } from '../domain/types'
import { buildFreshnessReport, daysOld } from './freshness'

const state: CurrentState = {
  last_updated: '2026-07-28',
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
}

const activities: Activity[] = [
  { id: 'a1', source: 'intervals', date: '2026-07-27', name: 'Ride', type: 'Ride' },
]

const races: Race[] = [
  { id: 'r1', date: '2026-08-02', name: 'Fixed race', discipline: 'cycling', priority: 'fixed', mandatory: true },
]

describe('freshness semantics', () => {
  it('computes non-negative age from ISO-like dates', () => {
    expect(daysOld('2026-07-29', '2026-07-27T10:00:00Z')).toBe(2)
    expect(daysOld('2026-07-29', undefined)).toBeUndefined()
    expect(daysOld('2026-07-29', '2026-08-01')).toBe(0)
  })

  it('marks local state as fresh when evidence is recent', () => {
    const report = buildFreshnessReport({ today: '2026-07-29', state, activities, races, syncedAt: '2026-07-29T08:00:00Z' })

    expect(report.overall).toBe('fresh')
    expect(report.staleSources).toEqual([])
  })

  it('surfaces stale or missing sources without deleting data', () => {
    const report = buildFreshnessReport({ today: '2026-07-29', state: { ...state, last_updated: '2026-04-30' }, activities: [], races: [], syncedAt: undefined })

    expect(report.overall).toBe('missing')
    expect(report.staleSources).toEqual(['current-state', 'activities', 'races', 'sync'])
    expect(report.signals.find((item) => item.source === 'current-state')?.status).toBe('stale')
  })
})
