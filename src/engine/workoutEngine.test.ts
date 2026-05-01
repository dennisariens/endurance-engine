import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import { makeWorkoutRecommendation } from './workoutEngine'

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  run_max_hr_6m: 200,
  cycle_max_hr_6m: 193,
  eftp_watts: 333,
}

const baseDecision: DailyDecision = {
  date: '2026-04-30',
  status: 'Green',
  mode: 'Build',
  today: 'Z2',
  coreAllowed: true,
  strengthAllowed: true,
  fastingAllowed: true,
  raceWeightAllowed: true,
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 0, reason: 'clear' },
  reasons: [],
}

describe('workoutEngine', () => {
  it('biases build days toward low-HR run durability', () => {
    const recommendation = makeWorkoutRecommendation({ decision: baseDecision, state })
    expect(recommendation.primary.discipline).toBe('run')
    expect(recommendation.primary.hrCap).toBe(150)
  })

  it('uses bike recovery as primary during damage control', () => {
    const recommendation = makeWorkoutRecommendation({ decision: { ...baseDecision, status: 'Red', mode: 'DamageControl', today: 'Recovery', daysUntilNextRace: 1, hrCap: 145 }, state })
    expect(recommendation.primary.discipline).toBe('bike')
    expect(recommendation.primary.intensity).toBe('opener')
    expect(recommendation.run?.hrCap).toBeLessThanOrEqual(145)
  })

  it('turns training off for injury or illness', () => {
    const recommendation = makeWorkoutRecommendation({ decision: { ...baseDecision, status: 'InjuryIllness', mode: 'RecoveryOptimization', today: 'Rest' }, state })
    expect(recommendation.primary.discipline).toBe('off')
    expect(recommendation.primary.durationMin).toBe(0)
  })
})
