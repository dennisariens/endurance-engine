import { describe, expect, it } from 'vitest'
import { stravaActivityProofAdapter, normalizeStravaActivityProofs } from './stravaActivityProofAdapter'

describe('stravaActivityProofAdapter', () => {
  it('declares a server-only activity-proof boundary', () => {
    expect(stravaActivityProofAdapter.descriptor).toMatchObject({
      id: 'strava',
      serverOnly: true,
      secretPolicy: 'no-client-secrets',
      role: 'activity-proof',
    })
  })

  it('normalizes Strava proof activities without credentials or OAuth fields', () => {
    const activities = normalizeStravaActivityProofs([
      { id: 123, name: 'Tempo proof', sport_type: 'Ride', start_date_local: '2026-05-01T18:00:00Z', moving_time: '3600', distance: 42000, suffer_score: 83, average_heartrate: 151 },
    ])

    expect(activities[0]).toEqual({
      id: 'strava-123',
      source: 'strava',
      date: '2026-05-01',
      name: 'Tempo proof',
      type: 'Ride',
      durationSec: 3600,
      distanceM: 42000,
      load: 83,
      avgHr: 151,
      maxHr: undefined,
      normalizedPower: undefined,
      avgPower: undefined,
    })
  })
})
