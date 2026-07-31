import { describe, expect, it } from 'vitest'
import type { CurrentState, DailyDecision, WorkoutRecommendation } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import { buildCoachBriefing } from './coachBriefingEngine'

const baseDecision: DailyDecision = {
  date: '2026-05-08',
  status: 'Red',
  mode: 'RecoveryOptimization',
  today: 'Recovery',
  hrCap: 145,
  coreAllowed: false,
  strengthAllowed: false,
  fastingAllowed: false,
  raceWeightAllowed: false,
  nextRace: {
    id: 'race-1',
    date: '2026-05-12',
    name: 'Chasing Pink - Stage 1',
    discipline: 'cycling',
    priority: 'fixed',
    mandatory: true,
  },
  daysUntilNextRace: 4,
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 1, reason: 'No race block' },
  reasons: ['Latest race cost is 80 / High', 'Recovery state is not ready for load'],
}

const recommendation: WorkoutRecommendation = {
  primary: {
    discipline: 'bike',
    title: 'Bike recovery spin / optional opener',
    durationMin: 35,
    intensity: 'easy',
    hrCap: 145,
    purpose: 'Keep blood moving without spending race readiness.',
    steps: [],
    cautions: [],
  },
  goalReminder: 'Protect the fixed race calendar.',
  longTermBias: 'Build durability without recovery debt.',
}

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'red',
  latest_race_cost: 80,
  latest_race_cost_band: 'High',
  resting_hr_14d_avg: 49.4,
  hrv_14d_avg: 49.2,
  sleep_hours_14d_avg: 7.9,
}

const next72Plan = {
  summary: 'Recovery debt is high.',
  risk: 'High' as const,
  blocks: [],
}

const canonicalState = {
  freshness: { overall: 'stale' },
  recovery: { status: 'green', confidence: 0.35, missingSignals: ['sleep'] },
  health: { injuryStatus: 'clear', illnessStatus: 'clear' },
} as unknown as CanonicalAthleteState

describe('buildCoachBriefing', () => {
  it('creates a direct coach brief with consequence language for red recovery', () => {
    const briefing = buildCoachBriefing({ decision: baseDecision, recommendation, state, next72Plan })

    expect(briefing.tone).toBe('red')
    expect(briefing.headline).toContain('Protect the engine')
    expect(briefing.status).toContain('Recovery Optimization')
    expect(briefing.recommendation).toContain('Bike recovery spin')
    expect(briefing.consequence).toContain('next fixed race')
    expect(briefing.nextAction).toContain('Log rest')
    expect(briefing.dominantConstraint).toContain('recovery debt')
  })

  it('surfaces missing Garmin-style signals without implying hidden certainty', () => {
    const briefing = buildCoachBriefing({ decision: baseDecision, recommendation, state, next72Plan })

    expect(briefing.missingSignals).toContain('Body Battery')
    expect(briefing.missingSignals).toContain('Training Readiness')
    expect(briefing.missingSignals).toContain('HRV trend')
  })

  it('treats injury or illness as a hard block in the coach brief', () => {
    const briefing = buildCoachBriefing({
      decision: { ...baseDecision, status: 'InjuryIllness', today: 'Rest' },
      recommendation,
      state: { ...state, injury_present: true },
      next72Plan: { ...next72Plan, risk: 'InjuryIllness' },
    })

    expect(briefing.tone).toBe('purple')
    expect(briefing.headline).toContain('Injury or illness block')
    expect(briefing.status).toContain('Blocked')
    expect(briefing.nextAction).toContain('Stop training load')
    expect(briefing.consequence).toContain('longer reset')
  })

  it('uses canonical state to cap confidence and dedupe missing signals', () => {
    const briefing = buildCoachBriefing({ decision: baseDecision, recommendation, state, next72Plan, athleteState: canonicalState })

    expect(briefing.confidence).toBe('low')
    expect(briefing.missingSignals).toContain('fresh canonical state')
    expect(briefing.missingSignals.filter((signal) => signal === 'sleep')).toHaveLength(1)
  })

  it('uses canonical health status as a dominant coach constraint before legacy state is updated', () => {
    const briefing = buildCoachBriefing({
      decision: { ...baseDecision, status: 'Green' },
      recommendation,
      state: { ...state, recovery_status: 'green', latest_race_cost_band: 'Low' },
      next72Plan,
      athleteState: {
        ...canonicalState,
        freshness: { overall: 'fresh' },
        recovery: { status: 'green', confidence: 0.8, missingSignals: [] },
        health: { injuryStatus: 'blocked', illnessStatus: 'clear' },
      } as unknown as CanonicalAthleteState,
    })

    expect(briefing.dominantConstraint).toBe('injury / illness block')
  })
})
