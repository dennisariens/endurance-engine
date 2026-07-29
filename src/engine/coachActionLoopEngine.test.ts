import { describe, expect, it } from 'vitest'
import type { CurrentState, DecisionLogEntry } from '../domain/types'
import type { ScenarioSimulation } from './scenarioSimulationEngine'
import { buildCoachActionLoop } from './coachActionLoopEngine'

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'yellow',
  latest_race_cost: 55,
  latest_race_cost_band: 'Medium',
}

const simulation: ScenarioSimulation = {
  summary: 'Compare today choices.',
  primaryConstraint: 'Recovery debt',
  confidence: 'medium',
  missingSignals: [],
  disclaimer: 'Predictions are ranges, not certainty.',
  scenarios: [
    { id: 'race', label: 'Race today', availability: 'advisory', horizon: '+24h to +72h', expectedCost: 76, expectedCostRange: { low: 68, high: 84 }, tomorrowFatigueDelta: 34, tomorrowFatigueDeltaRange: { low: 28, high: 40 }, recoveryLagDays: 4, recoveryLagDaysRange: { low: 3, high: 5 }, performanceRisk: 'high', nextRaceRisk: 'Elevated next-race risk', consequence: 'Spends recovery.', nextAction: 'Race only if fixed.', tone: 'blue' },
    { id: 'rest', label: 'Rest', availability: 'available', horizon: '+24h to +72h', expectedCost: 6, expectedCostRange: { low: 3, high: 9 }, tomorrowFatigueDelta: -8, tomorrowFatigueDeltaRange: { low: -11, high: -5 }, recoveryLagDays: 0, recoveryLagDaysRange: { low: 0, high: 0 }, performanceRisk: 'low', nextRaceRisk: 'Low next-race risk', consequence: 'Adaptation room.', nextAction: 'Protect sleep.', tone: 'green' },
    { id: 'easy', label: 'Easy aerobic', availability: 'available', horizon: '+24h to +72h', expectedCost: 28, expectedCostRange: { low: 20, high: 36 }, tomorrowFatigueDelta: 10, tomorrowFatigueDeltaRange: { low: 4, high: 16 }, recoveryLagDays: 1, recoveryLagDaysRange: { low: 0, high: 1 }, performanceRisk: 'medium', nextRaceRisk: 'Manageable risk', consequence: 'Useful if boring.', nextAction: 'Stay capped.', tone: 'yellow' },
    { id: 'ignore', label: 'Ignore / high intensity', availability: 'advisory', horizon: '+24h to +72h', expectedCost: 90, expectedCostRange: { low: 82, high: 98 }, tomorrowFatigueDelta: 46, tomorrowFatigueDeltaRange: { low: 40, high: 52 }, recoveryLagDays: 5, recoveryLagDaysRange: { low: 4, high: 6 }, performanceRisk: 'high', nextRaceRisk: 'Elevated risk', consequence: 'Recovery management.', nextAction: 'Log honestly.', tone: 'red' },
  ],
}

function entry(partial: Partial<DecisionLogEntry>): DecisionLogEntry {
  return {
    id: 'log-1',
    date: '2026-05-08',
    loggedAt: '2026-05-08T10:00:00.000Z',
    action: 'scenario-rest',
    mode: 'RecoveryOptimization',
    status: 'Yellow',
    workoutTitle: 'Rest',
    durationMin: 0,
    reason: 'test',
    ...partial,
  }
}

describe('buildCoachActionLoop', () => {
  it('asks for a scenario choice when nothing is logged today', () => {
    const loop = buildCoachActionLoop({ today: '2026-05-08', decisionLog: [], simulation, state })

    expect(loop.status).toBe('awaiting-choice')
    expect(loop.headline).toContain('Choose today')
    expect(loop.tomorrowAdjustment).toContain('No adjustment')
  })

  it('turns rest into a lower-cost tomorrow adjustment', () => {
    const loop = buildCoachActionLoop({ today: '2026-05-08', decisionLog: [entry({ action: 'scenario-rest', scenarioId: 'rest' })], simulation, state })

    expect(loop.status).toBe('logged')
    expect(loop.selectedScenario?.id).toBe('rest')
    expect(loop.tomorrowAdjustment).toContain('reassess for easy aerobic')
    expect(loop.guardrails).toContain('Keep sleep and normal fueling boringly consistent')
  })

  it('turns ignore/high-intensity into tighter guardrails without moralizing', () => {
    const loop = buildCoachActionLoop({ today: '2026-05-08', decisionLog: [entry({ action: 'scenario-ignore', scenarioId: 'ignore' })], simulation, state })

    expect(loop.selectedScenario?.id).toBe('ignore')
    expect(loop.tomorrowAdjustment).toContain('tighten')
    expect(loop.guardrails).toContain('No intensity until recovery signals stop objecting')
    expect(loop.coachNote).not.toMatch(/bad|fail|guilt/i)
  })
})
