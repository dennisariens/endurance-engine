import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import { buildScenarioSimulation } from './scenarioSimulationEngine'

const decision: DailyDecision = {
  date: '2026-05-08',
  status: 'Green',
  mode: 'Build',
  today: 'Z2',
  hrCap: 150,
  coreAllowed: true,
  strengthAllowed: true,
  fastingAllowed: true,
  raceWeightAllowed: true,
  daysUntilNextRace: 5,
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 1, reason: 'No race block active' },
  reasons: ['Recovery acceptable'],
}

const baseState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  latest_race_cost: 20,
  latest_race_cost_band: 'Low',
  sleep_hours_14d_avg: 7.8,
  recovery_score: 76,
}

describe('Garmin readiness modifiers in scenario simulation', () => {
  it('raises cost and confidence when Garmin readiness signals are strained', () => {
    const baseline = buildScenarioSimulation({ decision, state: { ...baseState, garmin_body_battery: 80, garmin_training_readiness: 78, garmin_stress_avg: 18, garmin_sleep_score: 88, garmin_hrv_status: 'balanced' } })
    const strained = buildScenarioSimulation({ decision, state: { ...baseState, garmin_body_battery: 18, garmin_training_readiness: 28, garmin_stress_avg: 62, garmin_sleep_score: 48, garmin_hrv_status: 'low' } })

    expect(baseline.confidence).toBe('high')
    expect(strained.confidence).toBe('high')
    expect(strained.primaryConstraint).toBe('Garmin readiness strain')
    expect(strained.scenarios.find((scenario) => scenario.id === 'ignore')?.expectedCost).toBeGreaterThan(baseline.scenarios.find((scenario) => scenario.id === 'ignore')?.expectedCost ?? 0)
  })
})
