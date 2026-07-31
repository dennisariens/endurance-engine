import type { DailyDecision, RaceCostBand } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { Next72Plan } from './recoveryPlanEngine'

export type TrajectoryDirection = 'improving' | 'stable' | 'degrading' | 'blocked'
export type TrajectoryScenarioId = 'recommended' | 'race' | 'rest' | 'ignore'

export type TrajectoryScenario = {
  id: TrajectoryScenarioId
  label: string
  readinessDeltaRange: { low: number; high: number }
  recoveryLagDaysRange: { low: number; high: number }
  risk: RaceCostBand | 'InjuryIllness'
  consequence: string
  confidence: number
}

export type TrajectoryEngineOutput = {
  engineVersion: string
  horizonDays: 21
  direction: TrajectoryDirection
  readinessRange: { low: number; high: number }
  confidence: number
  dominantConstraint: string
  scenarios: TrajectoryScenario[]
  evidenceIds: string[]
  notes: string[]
}

export const TRAJECTORY_ENGINE_VERSION = 'trajectory-engine-v1'

function clamp(value: number, low = 0, high = 100): number {
  return Math.max(low, Math.min(high, Math.round(value)))
}

function riskPenalty(risk: Next72Plan['risk']): number {
  if (risk === 'InjuryIllness') return 45
  if (risk === 'Extreme') return 28
  if (risk === 'High') return 18
  if (risk === 'Medium') return 9
  return 0
}

function directionFor(input: { athleteState: CanonicalAthleteState; plan: Next72Plan; base: number }): TrajectoryDirection {
  const { athleteState, plan, base } = input
  if (athleteState.health.injuryStatus === 'blocked' || athleteState.health.illnessStatus === 'blocked' || plan.risk === 'InjuryIllness') return 'blocked'
  if (athleteState.recovery.status === 'red' || riskPenalty(plan.risk) >= 18) return 'degrading'
  if (base >= 72 && athleteState.freshness.overall !== 'stale') return 'improving'
  return 'stable'
}

function dominantConstraint(athleteState: CanonicalAthleteState, plan: Next72Plan, decision: DailyDecision): string {
  if (athleteState.health.injuryStatus === 'blocked' || athleteState.health.illnessStatus === 'blocked') return 'health block'
  if (athleteState.recovery.status === 'blocked') return 'recovery block'
  if (athleteState.recovery.status === 'red') return 'recovery debt'
  if (plan.risk === 'Extreme' || plan.risk === 'High') return `race-cost debt ${plan.risk}`
  if (decision.raceBlock.active) return decision.raceBlock.reason
  if (athleteState.activeGoal?.limitingFactors[0]) return athleteState.activeGoal.limitingFactors[0]
  return 'low-cost aerobic progression'
}

function scenario(input: { id: TrajectoryScenarioId; base: number; plan: Next72Plan; athleteState: CanonicalAthleteState; readinessShift: number; lagLow: number; lagHigh: number; consequence: string }): TrajectoryScenario {
  const confidence = Math.min(0.9, Math.max(0.2, Math.round(((input.athleteState.recovery.confidence + input.athleteState.fatigue.confidence + input.athleteState.fitness.confidence) / 3) * 100) / 100))
  return {
    id: input.id,
    label: input.id === 'recommended' ? 'Follow recommendation' : input.id === 'race' ? 'Race / hard session' : input.id === 'rest' ? 'Rest' : 'Ignore and add intensity',
    readinessDeltaRange: { low: input.readinessShift - 4, high: input.readinessShift + 4 },
    recoveryLagDaysRange: { low: input.lagLow, high: input.lagHigh },
    risk: input.plan.risk,
    consequence: input.consequence,
    confidence,
  }
}

export function buildTrajectory(input: {
  athleteState: CanonicalAthleteState
  decision: DailyDecision
  next72Plan: Next72Plan
  goalReadiness?: GoalReadinessResult
}): TrajectoryEngineOutput {
  const { athleteState, decision, next72Plan, goalReadiness } = input
  const activeGoalScore = athleteState.activeGoal?.readiness.overall ?? goalReadiness?.overallReadiness ?? athleteState.recovery.score ?? 55
  const penalty = riskPenalty(next72Plan.risk)
  const freshnessPenalty = athleteState.freshness.overall === 'stale' ? 10 : athleteState.freshness.overall === 'partial' ? 4 : 0
  const low = clamp(activeGoalScore - penalty - freshnessPenalty - 6)
  const high = clamp(activeGoalScore - Math.round(penalty / 2) - freshnessPenalty + 8)
  const direction = directionFor({ athleteState, plan: next72Plan, base: activeGoalScore })
  const confidence = Math.min(0.92, Math.max(0.18, Math.round(((athleteState.recovery.confidence + athleteState.fatigue.confidence + (goalReadiness ? goalReadiness.confidence === 'high' ? 0.85 : goalReadiness.confidence === 'medium' ? 0.62 : 0.35 : 0.48)) / 3) * 100) / 100))
  const evidenceIds = athleteState.evidenceSummary.includedEvidenceIds.slice(0, 20)
  const notes = [
    'Prediction is a bounded range, not certainty.',
    'Completed activities and next readiness sync override this forecast.',
    athleteState.freshness.overall === 'stale' ? 'State is stale; confidence is capped until fresh evidence arrives.' : undefined,
  ].filter((note): note is string => Boolean(note))

  return {
    engineVersion: TRAJECTORY_ENGINE_VERSION,
    horizonDays: 21,
    direction,
    readinessRange: { low, high },
    confidence,
    dominantConstraint: dominantConstraint(athleteState, next72Plan, decision),
    scenarios: [
      scenario({ id: 'recommended', base: activeGoalScore, plan: next72Plan, athleteState, readinessShift: direction === 'blocked' ? -12 : direction === 'degrading' ? -4 : 4, lagLow: 0, lagHigh: next72Plan.risk === 'High' || next72Plan.risk === 'Extreme' ? 2 : 1, consequence: 'Preserves the best recovery-adjusted path while keeping fixed races in the model.' }),
      scenario({ id: 'race', base: activeGoalScore, plan: next72Plan, athleteState, readinessShift: next72Plan.risk === 'Low' ? -3 : -12, lagLow: 1, lagHigh: next72Plan.risk === 'Extreme' ? 5 : 3, consequence: 'Race/hard work buys stimulus by spending recovery budget and may narrow the next 72h window.' }),
      scenario({ id: 'rest', base: activeGoalScore, plan: next72Plan, athleteState, readinessShift: athleteState.recovery.status === 'red' ? 5 : 1, lagLow: 0, lagHigh: 1, consequence: 'Rest raises recovery probability, especially when stale or red signals reduce confidence.' }),
      scenario({ id: 'ignore', base: activeGoalScore, plan: next72Plan, athleteState, readinessShift: -18, lagLow: 2, lagHigh: 6, consequence: 'Ignoring the cap turns advisory risk into likely cleanup and delays goal readiness.' }),
    ],
    evidenceIds,
    notes,
  }
}
