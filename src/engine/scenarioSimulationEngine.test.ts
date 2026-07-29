import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import { buildScenarioSimulation } from './scenarioSimulationEngine'

const baseDecision: DailyDecision = {
  date: '2026-05-01',
  status: 'Green',
  mode: 'Build',
  today: 'Z2',
  hrCap: 150,
  coreAllowed: true,
  strengthAllowed: true,
  fastingAllowed: true,
  raceWeightAllowed: true,
  daysUntilNextRace: 5,
  nextRace: { id: 'race-1', date: '2026-05-06', name: 'Ronde van Aerion', discipline: 'cycling', priority: 'fixed', mandatory: true, distanceKm: 90 },
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 1, reason: 'No race block active' },
  reasons: ['Recovery is acceptable'],
}

const baseState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  latest_race_cost: 20,
  latest_race_cost_band: 'Low',
  hrv_trend: 'stable',
  sleep_hours_14d_avg: 7.5,
  recovery_score: 72,
}

describe('buildScenarioSimulation', () => {
  it('returns the four core forward choices in a stable order', () => {
    const simulation = buildScenarioSimulation({ decision: baseDecision, state: baseState })

    expect(simulation.summary).toContain('Compare today')
    expect(simulation.scenarios.map((scenario) => scenario.id)).toEqual(['race', 'rest', 'easy', 'ignore'])
    expect(simulation.scenarios.every((scenario) => scenario.horizon === '+24h to +72h')).toBe(true)
  })

  it('shows rest as the lowest cost choice and ignore as the highest risk choice', () => {
    const simulation = buildScenarioSimulation({ decision: baseDecision, state: baseState })
    const rest = simulation.scenarios.find((scenario) => scenario.id === 'rest')
    const ignore = simulation.scenarios.find((scenario) => scenario.id === 'ignore')

    expect(rest?.expectedCost).toBeLessThan(15)
    expect(rest?.tomorrowFatigueDelta).toBeLessThanOrEqual(0)
    expect(rest?.performanceRisk).toBe('low')
    expect(ignore?.expectedCost).toBeGreaterThan(60)
    expect(ignore?.performanceRisk).toBe('high')
    expect(ignore?.nextRaceRisk).toMatch(/elevated/i)
  })

  it('marks racing as unavailable when injury or illness is present', () => {
    const simulation = buildScenarioSimulation({
      decision: { ...baseDecision, status: 'InjuryIllness', today: 'Rest' },
      state: { ...baseState, injury_present: true, recovery_status: 'red', recovery_score: 20 },
    })
    const race = simulation.scenarios.find((scenario) => scenario.id === 'race')

    expect(race?.availability).toBe('blocked')
    expect(race?.nextAction).toContain('Do not race')
    expect(race?.expectedCost).toBeGreaterThanOrEqual(90)
  })

  it('raises scenario risk when the next fixed race is close', () => {
    const simulation = buildScenarioSimulation({
      decision: { ...baseDecision, daysUntilNextRace: 1, mode: 'DamageControl' },
      state: baseState,
    })
    const easy = simulation.scenarios.find((scenario) => scenario.id === 'easy')
    const race = simulation.scenarios.find((scenario) => scenario.id === 'race')

    expect(simulation.primaryConstraint).toBe('Race proximity')
    expect(easy?.nextRaceRisk).toMatch(/freshness/i)
    expect(race?.recoveryLagDays).toBeGreaterThanOrEqual(2)
  })

  it('accounts for poor health signals without presenting certainty', () => {
    const simulation = buildScenarioSimulation({
      decision: { ...baseDecision, status: 'Red', mode: 'RecoveryOptimization', today: 'Recovery' },
      state: { ...baseState, recovery_status: 'red', hrv_trend: 'declining', sleep_hours_14d_avg: 5.8, recovery_score: 34, latest_race_cost: 72, latest_race_cost_band: 'High' },
    })

    expect(simulation.confidence).toBe('medium')
    expect(simulation.missingSignals).toContain('Garmin Body Battery')
    expect(simulation.scenarios.find((scenario) => scenario.id === 'easy')?.performanceRisk).toBe('medium')
    expect(simulation.disclaimer).toContain('ranges')
  })
})
