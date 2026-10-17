import { describe, expect, it } from 'vitest'
import { dedupeSyncedActivities, mergeRacesByStableId } from './dedupe'

import type { Activity, Race } from '../../domain/types'

describe('integration dedupe rules', () => {
  it('keeps manual activities separate and dedupes synced activities by semantic buckets', () => {
    const activities: Activity[] = [
      { id: 'manual-local', source: 'manual', date: '2026-05-01', name: 'Local race note', type: 'Ride', durationSec: 3600, load: 90 },
      { id: 'strava-proof', source: 'strava', date: '2026-05-01', name: 'Race proof', type: 'Ride', durationSec: 3610, load: 88, avgHr: 155 },
      { id: 'intervals-truth', source: 'intervals', date: '2026-05-01', name: 'Race load', type: 'VirtualRide', durationSec: 3590, load: 92, normalizedPower: 255 },
    ]

    const deduped = dedupeSyncedActivities(activities)

    expect(deduped).toHaveLength(2)
    expect(deduped.map((activity) => activity.id)).toContain('manual-local')
    const synced = deduped.find((activity) => activity.source === 'intervals')
    expect(synced).toMatchObject({
      id: 'intervals-truth',
      source: 'intervals',
      avgHr: 155,
      normalizedPower: 255,
    })
  })

  it('preserves locally enriched race fields when merging stable event ids', () => {
    const existing: Race[] = [{ id: 'intervals-event-1', date: '2026-05-03', name: 'ECRO', discipline: 'cycling', priority: 'fixed', mandatory: true, notes: 'Local note' }]
    const incoming: Race[] = [{ id: 'intervals-event-1', date: '2026-05-03', name: 'ECRO updated', discipline: 'cycling', priority: 'fixed', mandatory: true, distanceKm: 41 }]

    expect(mergeRacesByStableId(existing, incoming)[0]).toMatchObject({
      id: 'intervals-event-1',
      name: 'ECRO',
      distanceKm: 41,
      notes: 'Local note',
    })
  })

  it('updates a stable synced ID even when revised metrics move it to another bucket', () => {
    const original: Activity = { id: 'intervals-synthetic', source: 'intervals', date: '2026-10-17', name: 'Synthetic activity', type: 'Run', durationSec: 3600, load: 30, avgHr: 120 }
    const merged = dedupeSyncedActivities([original, { ...original, load: 60, durationSec: 4000, avgHr: undefined }])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ load: 60, durationSec: 4000, avgHr: 120 })
  })

  it('is idempotent for repeated manual imports without merging distinct manual and synced records', () => {
    const manual: Activity = { id: 'manual-synthetic', source: 'manual', date: '2026-10-17', name: 'Synthetic activity', type: 'Run', durationSec: 3600, load: 30 }
    expect(dedupeSyncedActivities([manual, manual])).toEqual([manual])
    expect(dedupeSyncedActivities([manual, { ...manual, id: 'intervals-synthetic', source: 'intervals' }])).toHaveLength(2)
  })
})
