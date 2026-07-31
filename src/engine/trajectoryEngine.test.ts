import { describe, expect, it } from 'vitest'
import type { DailyDecision } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import type { Next72Plan } from './recoveryPlanEngine'
import { buildTrajectory } from './trajectoryEngine'

const decision: DailyDecision = {
  date: '2026-07-31',
  status: 'Green',
  mode: 'Build',
  today: 'Z2',
  hrCap: 145,
  coreAllowed: true,
  strengthAllowed: true,
  fastingAllowed: true,
  raceWeightAllowed: true,
  daysUntilNextRace: 14,
  raceBlock: { active: false, racesWithin72h: 0, racesWithin7d: 0, reason: 'No race block' },
  reasons: ['Recovery is acceptable'],
}

const plan: Next72Plan = {
  summary: 'Build aerobic capacity while keeping recovery debt low.',
  risk: 'Low',
  blocks: [],
}

const athleteState = {
  freshness: { overall: 'fresh' },
  recovery: { status: 'green', score: 78, confidence: 0.85 },
  fatigue: { confidence: 0.75 },
  fitness: { confidence: 0.65 },
  health: { injuryStatus: 'clear', illnessStatus: 'clear' },
  evidenceSummary: { includedEvidenceIds: ['state:current:2026-07-31'], warnings: [] },
  activeGoal: { readiness: { overall: 70 }, limitingFactors: [] },
} as unknown as CanonicalAthleteState

describe('buildTrajectory', () => {
  it('returns bounded scenario ranges instead of certainty', () => {
    const trajectory = buildTrajectory({ athleteState, decision, next72Plan: plan })

    expect(trajectory.engineVersion).toBe('trajectory-engine-v1')
    expect(trajectory.horizonDays).toBe(21)
    expect(trajectory.direction).toBe('stable')
    expect(trajectory.readinessRange.low).toBeLessThan(trajectory.readinessRange.high)
    expect(trajectory.scenarios.map((scenario) => scenario.id)).toEqual(['recommended', 'race', 'rest', 'ignore'])
    expect(trajectory.notes).toContain('Prediction is a bounded range, not certainty.')
  })

  it('blocks trajectory when canonical health is blocked', () => {
    const trajectory = buildTrajectory({
      athleteState: {
        ...athleteState,
        health: { injuryStatus: 'blocked', illnessStatus: 'clear' },
      } as CanonicalAthleteState,
      decision,
      next72Plan: { ...plan, risk: 'InjuryIllness' },
    })

    expect(trajectory.direction).toBe('blocked')
    expect(trajectory.dominantConstraint).toBe('health block')
    expect(trajectory.readinessRange.high).toBeLessThan(70)
  })

  it('caps confidence when state freshness is stale', () => {
    const trajectory = buildTrajectory({
      athleteState: {
        ...athleteState,
        freshness: { overall: 'stale' },
      } as CanonicalAthleteState,
      decision,
      next72Plan: plan,
    })

    expect(trajectory.notes).toContain('State is stale; confidence is capped until fresh evidence arrives.')
    expect(trajectory.readinessRange.low).toBeLessThan(trajectory.readinessRange.high)
  })
})
