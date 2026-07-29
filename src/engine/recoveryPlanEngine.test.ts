import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision } from '../domain/types'
import type { MorningReadinessVerdict } from './morningReadinessEngine'
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

const baseMorningReadiness: MorningReadinessVerdict = {
  date: '2026-05-01',
  verdict: 'Proceed',
  forwardState: 'clear',
  tone: 'green',
  headline: 'Proceed. Morning readiness clears the forward restriction.',
  primaryAction: 'Proceed: controlled aerobic work is allowed; caps remain ceilings, not targets.',
  reasons: ['Garmin/readiness stack is supportive enough for controlled work.'],
  signals: [],
  yesterdaySummary: 'No yesterday actual override available.',
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

  it('recalculates tomorrow from completed actual work when activity overrides logged intent', () => {
    const plan = buildNext72hPlan({
      decision: { ...baseDecision, status: 'Yellow', mode: 'Build', today: 'Z2' },
      state: baseState,
      actualOverride: {
        status: 'actual-overrides-log',
        authoritativeSource: 'completed-activity',
        severity: 'red',
        headline: 'Completed activity overrides the plan/log.',
        plannedSummary: 'Bike recovery spin · 35 min',
        loggedSummary: 'Rest · 0 min · scenario-rest',
        actualSummary: 'ECRO Zwift Race · 70 min · load 108',
        deltaSummary: 'Rest logged, but actual work exists. Completed work overrides intent.',
        tomorrowImpact: 'Tomorrow should recalculate from completed load.',
      },
    })

    expect(plan.summary).toContain('Actual completed work is authoritative')
    expect(plan.recalculation?.impactRange).toEqual({ low: 24, high: 72 })
    expect(plan.blocks[1].action).toBe('Actual-load recovery audit')
    expect(plan.blocks[1].hardLimits).toContain('Actual completed work overrides logged intent')
    expect(plan.blocks[1].hardLimits).toContain('No intensity until actual-load cost clears')
  })

  it('applies extend morning readiness as recovery-first for today and +24h on otherwise green build days', () => {
    const plan = buildNext72hPlan({
      decision: baseDecision,
      state: baseState,
      morningReadiness: {
        ...baseMorningReadiness,
        verdict: 'Recover',
        forwardState: 'extend',
        tone: 'red',
        headline: 'Recovery remains active. Yesterday has not cleared.',
        primaryAction: 'Recovery day: rest, walk, mobility, or Z1 only if the body stops filing complaints.',
      },
    })

    expect(plan.morningReadiness).toEqual({
      verdict: 'Recover',
      forwardState: 'extend',
      summary: 'Recovery remains active. Yesterday has not cleared.',
    })
    expect(plan.summary).toContain('Morning readiness applied')
    expect(plan.blocks[0].action).toBe('Morning readiness recovery')
    expect(plan.blocks[1].action).toBe('Morning readiness recovery')
    expect(plan.blocks[0].allowedWork).toEqual(['Rest', 'Walk 20–30 min', 'Mobility 8–10 min', 'Z1 only if readiness improves'])
    expect(plan.blocks[1].hardLimits).toContain('No intensity')
    expect(plan.blocks[1].hardLimits).toContain('No strength')
  })

  it('applies hold morning readiness by keeping only easy work and removing strength or intensity', () => {
    const plan = buildNext72hPlan({
      decision: baseDecision,
      state: baseState,
      morningReadiness: {
        ...baseMorningReadiness,
        verdict: 'Modify',
        forwardState: 'hold',
        tone: 'yellow',
        headline: 'Proceed only with modifications. Readiness is usable, not generous.',
        primaryAction: 'Modify: keep work easy, short, capped, and readiness-led.',
      },
    })

    expect(plan.morningReadiness?.forwardState).toBe('hold')
    expect(plan.blocks[0].action).toBe('Readiness-held easy work')
    expect(plan.blocks[0].allowedWork).toEqual(['Easy spin', 'Walk 20–30 min', 'Mobility'])
    expect(plan.blocks[0].hardLimits).toContain('No intensity')
    expect(plan.blocks[0].hardLimits).toContain('No strength')
    expect(plan.blocks[0].allowedWork.join(' ')).not.toMatch(/strength|intensity/i)
  })

  it('leaves normal build plan unchanged when morning readiness clears the forward restriction', () => {
    const plan = buildNext72hPlan({
      decision: baseDecision,
      state: baseState,
      morningReadiness: baseMorningReadiness,
    })

    expect(plan.morningReadiness).toEqual({
      verdict: 'Proceed',
      forwardState: 'clear',
      summary: 'Proceed. Morning readiness clears the forward restriction.',
    })
    expect(plan.blocks[0].action).toBe('Aerobic build')
    expect(plan.blocks[0].allowedWork).toContain('Low-HR aerobic work')
    expect(plan.blocks[0].hardLimits).not.toContain('No intensity')
  })

  it('keeps today dominated by completed actual work over morning readiness', () => {
    const plan = buildNext72hPlan({
      decision: baseDecision,
      state: baseState,
      actualOverride: {
        status: 'actual-overrides-log',
        authoritativeSource: 'completed-activity',
        severity: 'red',
        headline: 'Completed activity overrides the plan/log.',
        plannedSummary: 'Bike recovery spin · 35 min',
        loggedSummary: 'Rest · 0 min · scenario-rest',
        actualSummary: 'ECRO Zwift Race · 70 min · load 108',
        deltaSummary: 'Rest logged, but actual work exists. Completed work overrides intent.',
        tomorrowImpact: 'Tomorrow should recalculate from completed load.',
      },
      morningReadiness: {
        ...baseMorningReadiness,
        verdict: 'Recover',
        forwardState: 'extend',
        tone: 'red',
        headline: 'Recovery remains active. Yesterday has not cleared.',
      },
    })

    expect(plan.summary).toContain('Actual completed work is authoritative')
    expect(plan.recalculation?.source).toBe('completed-activity')
    expect(plan.blocks[1].action).toBe('Actual-load recovery audit')
    expect(plan.blocks[1].hardLimits).toContain('Actual completed work overrides logged intent')
  })
})
