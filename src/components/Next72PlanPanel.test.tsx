import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import { buildNext72hPlan } from '../engine/recoveryPlanEngine'
import { Next72PlanPanel } from './Next72PlanPanel'

const decision: DailyDecision = {
  date: '2026-05-01',
  status: 'Red',
  mode: 'RecoveryOptimization',
  today: 'Recovery',
  hrCap: 145,
  coreAllowed: false,
  strengthAllowed: false,
  fastingAllowed: false,
  raceWeightAllowed: false,
  daysUntilNextRace: 1,
  raceBlock: { active: true, racesWithin72h: 2, racesWithin7d: 3, reason: '2 races within 72h' },
  reasons: ['Latest race cost is 88 / Extreme'],
}

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'red',
  latest_race_cost: 88,
  latest_race_cost_band: 'Extreme',
}

describe('Next72PlanPanel', () => {
  it('renders the next 72h recovery plan with guardrails and provisional ceiling language', () => {
    const plan = buildNext72hPlan({ decision, state })
    const markup = renderToStaticMarkup(<Next72PlanPanel plan={plan} />)

    expect(markup).toContain('NEXT 72H')
    expect(markup).toContain('Recovery debt is high')
    expect(markup).toContain('Today')
    expect(markup).toContain('+24h')
    expect(markup).toContain('+48h')
    expect(markup).toContain('+72h')
    expect(markup).toContain('HR ≤ 145 · provisional ceiling')
    expect(markup).toContain('Caps are ceilings, not targets')
    expect(markup).not.toContain('HR target')
  })
})
