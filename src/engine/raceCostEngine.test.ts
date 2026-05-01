import { describe, expect, it } from 'vitest'
import { bandRaceCost, explainRaceCost, estimateRaceCost } from './raceCostEngine'

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

  it('explains each factor behind the estimated score', () => {
    const explanation = explainRaceCost({ id: 'a', source: 'manual', date: '2026-04-28', name: 'Zwift Racing League Race', type: 'VirtualRide', durationSec: 4800, load: 105, avgHr: 154, maxHr: 181 })

    expect(explanation.score).toBeGreaterThan(70)
    expect(explanation.band).toBe('Extreme')
    expect(explanation.factors.map((factor) => factor.label)).toEqual(['Duration', 'Load', 'Avg HR', 'Max HR', 'Density', 'Race penalty'])
    expect(explanation.factors.find((factor) => factor.label === 'Duration')?.points).toBeCloseTo(13.3, 1)
    expect(explanation.factors.find((factor) => factor.label === 'Load')?.points).toBeCloseTo(32.3, 1)
    expect(explanation.factors.find((factor) => factor.label === 'Race penalty')?.points).toBe(10)
  })
})
