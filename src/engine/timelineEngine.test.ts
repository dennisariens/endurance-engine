import { describe, expect, it } from 'vitest'
import type { Activity, DecisionLogEntry, Race } from '../domain/types'
import { buildOperationalTimeline, getLocalIsoDate, mergeActivitiesById } from './timelineEngine'

const activity = (overrides: Partial<Activity>): Activity => ({
  id: 'activity-1',
  source: 'intervals',
  date: '2026-04-30',
  name: 'Sort-like activity',
  type: 'Ride',
  load: 42,
  ...overrides,
})

const race = (overrides: Partial<Race>): Race => ({
  id: 'race-1',
  date: '2026-05-01',
  name: 'Chasing Frankfurt',
  discipline: 'cycling',
  priority: 'fixed',
  mandatory: true,
  ...overrides,
})

const decision = (overrides: Partial<DecisionLogEntry>): DecisionLogEntry => ({
  id: 'decision-1',
  date: '2026-04-30',
  loggedAt: '2026-04-30T08:00:00.000Z',
  action: 'accepted',
  mode: 'DamageControl',
  status: 'Red',
  workoutTitle: 'Bike recovery spin / optional opener',
  durationMin: 25,
  reason: 'Preserve freshness',
  ...overrides,
})

describe('getLocalIsoDate', () => {
  it('returns the local calendar date instead of a fixed fixture date', () => {
    expect(getLocalIsoDate(new Date('2026-05-01T13:00:00+02:00'))).toBe('2026-05-01')
  })
})

describe('mergeActivitiesById', () => {
  it('updates synced activities without losing manual-only activities', () => {
    const merged = mergeActivitiesById({
      current: [activity({ id: 'manual-1', source: 'manual', name: 'Manual note' }), activity({ id: 'synced-1', name: 'Old name' })],
      incoming: [activity({ id: 'synced-1', name: 'Updated from Intervals' })],
    })

    expect(merged.map((item) => item.id)).toEqual(['manual-1', 'synced-1'])
    expect(merged.find((item) => item.id === 'synced-1')?.name).toBe('Updated from Intervals')
  })
})

describe('buildOperationalTimeline', () => {
  it('shows actual activity even when the recommendation was not accepted', () => {
    const timeline = buildOperationalTimeline({
      today: '2026-05-01',
      races: [race({}), race({ id: 'race-later', date: '2026-10-11', name: 'Chasing Lombardia' })],
      activities: [activity({ date: '2026-04-30' })],
      decisions: [],
    })

    expect(timeline[0]).toMatchObject({ date: '2026-05-01', kind: 'race' })
    expect(timeline[1]).toMatchObject({ date: '2026-04-30', kind: 'actual', label: 'Sort-like activity', status: 'actual-no-plan-click' })
    expect(timeline[2]).toMatchObject({ date: '2026-10-11', kind: 'race' })
  })

  it('marks accepted recommendations with actuals as completed', () => {
    const timeline = buildOperationalTimeline({
      today: '2026-04-30',
      races: [],
      activities: [activity({ date: '2026-04-30' })],
      decisions: [decision({ action: 'accepted' })],
    })

    expect(timeline[0]).toMatchObject({ kind: 'actual', status: 'completed-after-acceptance' })
  })
}
)
