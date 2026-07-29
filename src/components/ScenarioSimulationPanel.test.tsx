import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ScenarioSimulation } from '../engine/scenarioSimulationEngine'
import { ScenarioSimulationPanel } from './ScenarioSimulationPanel'

const simulation: ScenarioSimulation = {
  summary: 'Compare today’s options by expected cost, fatigue, recovery lag, and next-race risk.',
  primaryConstraint: 'Race proximity',
  confidence: 'medium',
  missingSignals: ['Garmin Body Battery', 'Sleep score'],
  disclaimer: 'Predictions are ranges, not certainty. Actual completed work and recovery signals override the forecast.',
  scenarios: [
    { id: 'race', label: 'Race today', availability: 'advisory', horizon: '+24h to +72h', expectedCost: 82, expectedCostRange: { low: 74, high: 90 }, tomorrowFatigueDelta: 38, tomorrowFatigueDeltaRange: { low: 32, high: 44 }, recoveryLagDays: 4, recoveryLagDaysRange: { low: 3, high: 5 }, performanceRisk: 'high', nextRaceRisk: 'Elevated next-race risk', consequence: 'Spends recovery capital aggressively.', nextAction: 'Only choose this if fixed.', tone: 'blue' },
    { id: 'rest', label: 'Rest', availability: 'available', horizon: '+24h to +72h', expectedCost: 7, expectedCostRange: { low: 4, high: 10 }, tomorrowFatigueDelta: -6, tomorrowFatigueDeltaRange: { low: -9, high: -3 }, recoveryLagDays: 0, recoveryLagDaysRange: { low: 0, high: 0 }, performanceRisk: 'low', nextRaceRisk: 'Low next-race risk', consequence: 'Adaptation room.', nextAction: 'Protect sleep.', tone: 'green' },
    { id: 'easy', label: 'Easy aerobic', availability: 'available', horizon: '+24h to +72h', expectedCost: 28, expectedCostRange: { low: 20, high: 36 }, tomorrowFatigueDelta: 10, tomorrowFatigueDeltaRange: { low: 4, high: 16 }, recoveryLagDays: 1, recoveryLagDaysRange: { low: 0, high: 1 }, performanceRisk: 'low', nextRaceRisk: 'Manageable next-race risk', consequence: 'Useful if boring.', nextAction: 'Keep HR capped.', tone: 'yellow' },
    { id: 'ignore', label: 'Ignore / high intensity', availability: 'advisory', horizon: '+24h to +72h', expectedCost: 88, expectedCostRange: { low: 80, high: 96 }, tomorrowFatigueDelta: 42, tomorrowFatigueDeltaRange: { low: 36, high: 48 }, recoveryLagDays: 4, recoveryLagDaysRange: { low: 3, high: 5 }, performanceRisk: 'high', nextRaceRisk: 'Elevated next-race risk', consequence: 'Tomorrow becomes cleanup work.', nextAction: 'Log the override.', tone: 'red' },
  ],
}

describe('ScenarioSimulationPanel', () => {
  it('renders all core scenarios and risk deltas', () => {
    const markup = renderToStaticMarkup(<ScenarioSimulationPanel simulation={simulation} />)

    expect(markup).toContain('SCENARIO SIMULATION')
    expect(markup).toContain('Race today')
    expect(markup).toContain('Rest')
    expect(markup).toContain('Easy aerobic')
    expect(markup).toContain('Ignore / high intensity')
    expect(markup).toContain('Cost 74–90')
    expect(markup).toContain('Fatigue +32 to +44')
    expect(markup).toContain('Lag 3–5d')
    expect(markup).toContain('Predictions are ranges, not certainty')
  })

  it('shows missing signals and confidence transparently', () => {
    const markup = renderToStaticMarkup(<ScenarioSimulationPanel simulation={simulation} />)

    expect(markup).toContain('Race proximity')
    expect(markup).toContain('MEDIUM CONFIDENCE')
    expect(markup).toContain('Garmin Body Battery')
    expect(markup).toContain('Sleep score')
  })
})
