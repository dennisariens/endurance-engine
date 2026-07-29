import { describe, expect, it } from 'vitest'
import { buildBriefingPayload, fetchIntervalsContext } from './aerionApi'

describe('aerion API services', () => {
  it('returns a safe unavailable sync when Intervals credentials are missing', async () => {
    const payload = await fetchIntervalsContext({ env: {}, now: new Date('2026-07-29T00:00:00Z') })

    expect(payload).toMatchObject({ ok: false, source: 'unavailable' })
    expect(payload.message).toContain('using local fixture/manual data only')
  })

  it('normalizes live Intervals activity, wellness, and event rows', async () => {
    const calls: string[] = []
    const fetchImpl = async (url: string) => {
      calls.push(url)
      if (url.includes('/activities?')) return { ok: true, status: 200, json: async () => [{ id: '42', start_date_local: '2026-07-28T08:00:00', name: 'Intervals ride', type: 'VirtualRide', moving_time: 3600, icu_training_load: 70 }] }
      if (url.includes('/wellness?')) return { ok: true, status: 200, json: async () => [{ id: '2026-07-28', restingHR: 48, hrv: 55, sleepSecs: 28800 }] }
      return { ok: true, status: 200, json: async () => [{ id: 'race-1', date: '2026-08-02', name: 'Zwift Racing League test', type: 'Ride', distance: 45000 }] }
    }

    const payload = await fetchIntervalsContext({ env: { INTERVALS_ICU_API_KEY: 'test-key', INTERVALS_ICU_ATHLETE_ID: 'athlete' }, fetchImpl, now: new Date('2026-07-29T00:00:00Z') })

    expect(calls).toHaveLength(3)
    expect(payload.ok).toBe(true)
    expect(payload.activities?.[0]).toMatchObject({ id: 'intervals-42', source: 'intervals', load: 70 })
    expect(payload.races?.[0]).toMatchObject({ id: 'intervals-event-race-1', mandatory: true })
    expect(payload.state).toMatchObject({ last_updated: '2026-07-28', resting_hr_14d_avg: 48, sleep_hours_14d_avg: 8 })
  })

  it('builds briefing from fixture state when sync is unavailable', async () => {
    const payload = await buildBriefingPayload({ env: {}, date: '2026-04-30', now: new Date('2026-07-29T00:00:00Z') })

    expect(payload.ok).toBe(true)
    expect(payload.source).toBe('local-fixture')
    expect(payload.sync.source).toBe('unavailable')
  })
})
