import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import { buildNext72hPlan } from './recoveryPlanEngine'

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
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 1, reason: 'No race block active' },
  reasons: ['Recovery is acceptable'],
}

const baseState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  latest_race_cost: 20,
  latest_race_cost_band: 'Low',
  eftp_watts: 333,
  resting_hr_14d_avg: 49.4,
  hrv_14d_avg: 49.2,
  sleep_hours_14d_avg: 7.9,
}

describe('buildNext72hPlan', () => {
  it('creates four horizon blocks from today through +72h', () => {
    const plan = buildNext72hPlan({ decision: baseDecision, state: baseState })

    expect(plan.blocks.map((block) => block.horizon)).toEqual(['Today', '+24h', '+48h', '+72h'])
    expect(plan.blocks[0].date).toBe('2026-05-01')
    expect(plan.blocks[3].date).toBe('2026-05-04')
  })

  it('keeps build days aerobic with HR caps described as provisional ceilings', () => {
    const plan = buildNext72hPlan({ decision: baseDecision, state: baseState })

    expect(plan.summary).toContain('Build aerobic capacity')
    expect(plan.blocks[0].allowedWork).toContain('Low-HR aerobic work')
    expect(plan.blocks[0].hardLimits).toContain('HR ≤ 150 · provisional ceiling')
    expect(plan.blocks[0].hardLimits).not.toContain('target')
  })

  it('protects the full window after extreme race cost', () => {
    const plan = buildNext72hPlan({
      decision: { ...baseDecision, status: 'Red', mode: 'RecoveryOptimization', today: 'Recovery', hrCap: 145 },
      state: { ...baseState, recovery_status: 'red', latest_race_cost: 88, latest_race_cost_band: 'Extreme' },
    })

    expect(plan.summary).toContain('Recovery debt is high')
    expect(plan.blocks[0].action).toBe('Recovery only')
    expect(plan.blocks[0].hardLimits).toContain('No intensity')
    expect(plan.blocks[1].hardLimits).toContain('No strength')
    expect(plan.blocks[2].allowedWork).toContain('Z1 spin or walk')
  })

  it('shows fixed race override while preserving post-race recovery guardrails', () => {
    const plan = buildNext72hPlan({
      decision: { ...baseDecision, mode: 'Race', today: 'Race', daysUntilNextRace: 0, nextRace: { id: 'r1', date: '2026-05-01', name: 'Chasing Frankfurt', discipline: 'cycling', priority: 'fixed', mandatory: true } },
      state: baseState,
    })

    expect(plan.blocks[0].action).toBe('Race execution')
    expect(plan.blocks[0].allowedWork).toContain('Mandatory race override active')
    expect(plan.blocks[1].action).toBe('Post-race reset')
    expect(plan.blocks[1].hardLimits).toContain('No bonus volume')
  })

  it('blocks training and racing when injury or illness is present', () => {
    const plan = buildNext72hPlan({
      decision: { ...baseDecision, status: 'InjuryIllness', mode: 'RecoveryOptimization', today: 'Rest' },
      state: { ...baseState, injury_present: true },
    })

    expect(plan.summary).toContain('Injury/illness block active')
    expect(plan.blocks.every((block) => block.action === 'Medical recovery')).toBe(true)
    expect(plan.blocks[0].hardLimits).toContain('No racing')
  })
})
