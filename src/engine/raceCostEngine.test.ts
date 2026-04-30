import { describe, expect, it } from 'vitest'
import { bandRaceCost, estimateRaceCost } from './raceCostEngine'

describe('raceCostEngine', () => {
  it('bands scores', () => {
    expect(bandRaceCost(20)).toBe('Low')
    expect(bandRaceCost(45)).toBe('Medium')
    expect(bandRaceCost(70)).toBe('High')
    expect(bandRaceCost(90)).toBe('Extreme')
  })

  it('estimates race cost from activity summary', () => {
    const cost = estimateRaceCost({ id: 'a', source: 'manual', date: '2026-04-28', name: 'Race', type: 'VirtualRide', durationSec: 4800, load: 105, avgHr: 154, maxHr: 181 })
    expect(cost.score).toBeGreaterThan(70)
    expect(cost.band).toBe('Extreme')
  })
})
