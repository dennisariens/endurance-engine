import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState } from '../domain/types'
import { buildIntegrationHealth } from './integrationHealth'

const baseState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'unknown',
}

const activities: Activity[] = [
  { id: 'intervals-1', source: 'intervals', date: '2026-07-27', name: 'Tempo ride', type: 'Ride', load: 82 },
  { id: 'strava-1', source: 'strava', date: '2026-07-27', name: 'Tempo ride', type: 'Ride' },
  { id: 'manual-1', source: 'manual', date: '2026-07-28', name: 'Race commitment', type: 'Race' },
]

describe('buildIntegrationHealth', () => {
  it('turns current app state into one-stop source health cards', () => {
    const health = buildIntegrationHealth({
      activities,
      state: { ...baseState, garmin_training_readiness: 72, garmin_sleep_score: 81 },
      syncStatus: { state: 'fresh', message: 'Synced', activityCount: 1, raceCount: 0, lastSyncedAt: '2026-07-27T08:00:00.000Z' },
    })

    expect(health.map((source) => source.id)).toEqual(['intervals', 'garmin', 'strava', 'manual'])
    expect(health.find((source) => source.id === 'intervals')?.state).toBe('connected')
    expect(health.find((source) => source.id === 'garmin')?.state).toBe('connected')
    expect(health.find((source) => source.id === 'strava')?.state).toBe('connected')
    expect(health.find((source) => source.id === 'manual')?.state).toBe('local')
  })

  it('keeps Garmin and Strava pending until their adapters provide data', () => {
    const health = buildIntegrationHealth({
      activities: activities.filter((activity) => activity.source !== 'strava'),
      state: baseState,
      syncStatus: { state: 'offline', message: 'No opening sync available.' },
    })

    expect(health.find((source) => source.id === 'intervals')?.state).toBe('offline')
    expect(health.find((source) => source.id === 'garmin')?.state).toBe('not-connected')
    expect(health.find((source) => source.id === 'strava')?.state).toBe('not-connected')
  })
})
