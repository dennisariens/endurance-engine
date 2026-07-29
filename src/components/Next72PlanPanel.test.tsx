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

  it('renders forward recalculation when actual work overrides intent', () => {
    const plan = buildNext72hPlan({
      decision,
      state,
      actualOverride: {
        status: 'actual-overrides-log',
        authoritativeSource: 'completed-activity',
        severity: 'red',
        headline: 'Completed activity overrides the plan/log.',
        plannedSummary: 'Plan',
        loggedSummary: 'Rest',
        actualSummary: 'Race',
        deltaSummary: 'Rest logged, but actual work exists. Completed work overrides intent.',
        tomorrowImpact: 'Recalculate.',
      },
    })
    const markup = renderToStaticMarkup(<Next72PlanPanel plan={plan} />)

    expect(markup).toContain('Forward recalculation')
    expect(markup).toContain('actual overrides log')
    expect(markup).toContain('Impact 24–72h')
  })

  it('renders carried morning readiness state when it modifies the next 72h plan', () => {
    const plan = buildNext72hPlan({
      decision: { ...decision, status: 'Green', mode: 'Build', today: 'Z2', raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 0, reason: 'No race block active' } },
      state: { ...state, recovery_status: 'green', latest_race_cost: 20, latest_race_cost_band: 'Low' },
      morningReadiness: {
        date: '2026-05-01',
        verdict: 'Modify',
        forwardState: 'hold',
        tone: 'yellow',
        headline: 'Proceed only with modifications. Readiness is usable, not generous.',
        primaryAction: 'Modify: keep work easy, short, capped, and readiness-led.',
        reasons: ['Composite morning debt: 7.'],
        signals: [],
        yesterdaySummary: 'No yesterday actual override available.',
      },
    })
    const markup = renderToStaticMarkup(<Next72PlanPanel plan={plan} />)

    expect(markup).toContain('Morning readiness applied')
    expect(markup).toContain('Modify')
    expect(markup).toContain('hold')
    expect(markup).toContain('Proceed only with modifications')
  })
})
