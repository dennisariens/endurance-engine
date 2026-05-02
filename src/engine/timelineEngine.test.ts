import { describe, expect, it } from 'vitest'
import type { Activity, DecisionLogEntry, Race } from '../domain/types'
import { buildOperationalTimeline, getLocalIsoDate, isRaceLikeActivity, mergeActivitiesById, mergeRacesById } from './timelineEngine'

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

  it('dedupes fixture and synced copies of the same activity by activity facts, preserving race cost context', () => {
    const merged = mergeActivitiesById({
      current: [
        activity({ id: 'activity-20260428-zrl', date: '2026-04-28', name: 'Zwift Racing League: Legends Route', type: 'VirtualRide', durationSec: 4771, load: 105, raceCost: 82 }),
      ],
      incoming: [
        activity({ id: 'intervals-i143815167', date: '2026-04-28', name: 'Zwift - Race: Zwift Racing League: Legends Route - Open Shamrock League Division 1 (A)', type: 'VirtualRide', durationSec: 4771, load: 105 }),
      ],
    })

    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({
      id: 'intervals-i143815167',
      name: 'Zwift - Race: Zwift Racing League: Legends Route - Open Shamrock League Division 1 (A)',
      raceCost: 82,
    })
  })
})

describe('mergeRacesById', () => {
  it('updates synced races without losing manual calendar races', () => {
    const merged = mergeRacesById({
      current: [race({ id: 'manual-race', name: 'Manual race' }), race({ id: 'synced-race', name: 'Old synced race' })],
      incoming: [race({ id: 'synced-race', name: 'Updated synced race' })],
    })

    expect(merged.map((item) => item.id)).toEqual(['manual-race', 'synced-race'])
    expect(merged.find((item) => item.id === 'synced-race')?.name).toBe('Updated synced race')
  })
})

describe('isRaceLikeActivity', () => {
  it('detects race activities even when they come in as normal Intervals activities', () => {
    expect(isRaceLikeActivity(activity({ name: 'Zwift Racing League - Stage 2', type: 'VirtualRide' }))).toBe(true)
    expect(isRaceLikeActivity(activity({ name: 'Easy endurance ride', type: 'Ride' }))).toBe(false)
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

  it('logs race-like activities as completed race entries, not generic actuals', () => {
    const timeline = buildOperationalTimeline({
      today: '2026-05-01',
      races: [],
      activities: [activity({ date: '2026-05-01', name: 'ECRO Zwift Race', type: 'VirtualRide', load: 91 })],
      decisions: [],
    })

    expect(timeline[0]).toMatchObject({ kind: 'race', status: 'race-completed', label: 'ECRO Zwift Race', source: 'intervals' })
  })

  it('does not duplicate a planned race when a race-like actual exists for that race date', () => {
    const timeline = buildOperationalTimeline({
      today: '2026-05-01',
      races: [race({ id: 'planned-ecro', date: '2026-05-01', name: 'ECRO Race Night' })],
      activities: [activity({ id: 'actual-ecro', date: '2026-05-01', name: 'ECRO Zwift Race', type: 'VirtualRide', load: 91 })],
      decisions: [],
    })

    expect(timeline).toHaveLength(1)
    expect(timeline[0]).toMatchObject({
      id: 'race-activity:actual-ecro',
      kind: 'race',
      status: 'race-completed',
      label: 'ECRO Zwift Race',
    })
  })
})
