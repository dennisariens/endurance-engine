import { describe, expect, it } from 'vitest'
import { normalizeIntervalsActivities, normalizeIntervalsEvents, normalizeIntervalsWellness } from './intervalsSyncEngine'

describe('normalizeIntervalsActivities', () => {
  it('maps Intervals summaries to AERION activities', () => {
    const activities = normalizeIntervalsActivities([
      {
        id: 'i123',
        name: 'Afternoon Ride',
        type: 'Ride',
        start_date_local: '2026-04-30T17:31:00',
        moving_time: 3670,
        distance: 42195,
        icu_training_load: 55,
        average_heartrate: 141,
        max_heartrate: 176,
        weighted_average_watts: 222,
        average_watts: 201,
      },
    ])

    expect(activities[0]).toMatchObject({
      id: 'intervals-i123',
      source: 'intervals',
      date: '2026-04-30',
      name: 'Afternoon Ride',
      type: 'Ride',
      durationSec: 3670,
      distanceM: 42195,
      load: 55,
      avgHr: 141,
      maxHr: 176,
      normalizedPower: 222,
      avgPower: 201,
    })
  })

  it('keeps race-like Intervals activities available as completed race logs', () => {
    const activities = normalizeIntervalsActivities([
      {
        id: 'zrl-1',
        name: 'Zwift Racing League - Stage 2',
        type: 'VirtualRide',
        start_date_local: '2026-05-01T19:00:00',
        moving_time: 3120,
        icu_training_load: 87,
      },
    ])

    expect(activities[0]).toMatchObject({
      id: 'intervals-zrl-1',
      date: '2026-05-01',
      name: 'Zwift Racing League - Stage 2',
      type: 'VirtualRide',
    })
  })
})

describe('normalizeIntervalsEvents', () => {
  it('maps Intervals future events to fixed races without exposing credentials', () => {
    const races = normalizeIntervalsEvents([
      {
        id: 'event-1',
        name: 'ECRO Series Race',
        start_date_local: '2026-05-07T20:00:00',
        type: 'Ride',
        distance: 41000,
        total_elevation_gain: 380,
      },
    ])

    expect(races[0]).toMatchObject({
      id: 'intervals-event-event-1',
      date: '2026-05-07',
      name: 'ECRO Series Race',
      discipline: 'cycling',
      priority: 'fixed',
      mandatory: true,
      distanceKm: 41,
      elevationM: 380,
    })
  })
})

describe('normalizeIntervalsWellness', () => {
  it('uses the latest wellness row for current state freshness signals', () => {
    const state = normalizeIntervalsWellness([
      { id: '2026-04-29', restingHR: 50, hrv: 45, sleepSecs: 25200 },
      { id: '2026-04-30', restingHR: 48, hrv: 51, sleepSecs: 28800 },
    ])

    expect(state).toMatchObject({
      last_updated: '2026-04-30',
      resting_hr_14d_avg: 48,
      hrv_14d_avg: 51,
      sleep_hours_14d_avg: 8,
    })
  })
})
