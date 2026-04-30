import { describe, expect, it } from 'vitest'
import type { Activity, Race } from '../domain/types'
import { buildDashboardStats } from './statsEngine'

const race = (date: string): Race => ({ id: date, date, name: 'Fixed Race', discipline: 'cycling', priority: 'fixed', mandatory: true })
const activity = (date: string, raceCost: number): Activity => ({ id: date, source: 'manual', date, name: 'Activity', type: 'Ride', raceCost })

describe('statsEngine', () => {
  it('counts fixed race density windows', () => {
    const stats = buildDashboardStats({ today: '2026-04-30', races: [race('2026-05-01'), race('2026-05-03'), race('2026-06-01')], activities: [] })
    expect(stats.racesNext7d).toBe(2)
    expect(stats.racesNext30d).toBe(2)
    expect(stats.fixedRaceCount).toBe(3)
  })

  it('summarizes recent race costs', () => {
    const stats = buildDashboardStats({ today: '2026-04-30', races: [], activities: [activity('2026-04-01', 20), activity('2026-04-02', 90)] })
    expect(stats.avgRaceCost).toBe(55)
    expect(stats.highCostActivities).toBe(1)
    expect(stats.raceCostSeries).toHaveLength(2)
  })
})
