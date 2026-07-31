import type { Goal, Race, WorkoutRecommendation } from '../domain/types'
import type { CoachBriefing } from './coachBriefingEngine'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { LearningEngineOutput } from './learningEngine'
import type { MorningReadinessVerdict } from './morningReadinessEngine'
import type { PathToGoal } from './pathEngine'
import type { Next72Plan } from './recoveryPlanEngine'
import type { TrajectoryEngineOutput } from './trajectoryEngine'

export type DailyRecommendation = {
  engineVersion: string
  headline: string
  today: {
    action: string
    durationMin: number
    intensity: string
    safeNext: string
    reason: string
    consequence: string
  }
  goal: {
    name: string
    status: string
    readiness?: number
    phase?: string
    limiter?: string
    nextFocus: string
  }
  week: {
    focus: string
    structure: string[]
    avoid: string[]
    risk: Next72Plan['risk']
  }
  longTerm: {
    direction: TrajectoryEngineOutput['direction']
    readinessRange: TrajectoryEngineOutput['readinessRange']
    stance: string
  }
  connect: {
    primary: 'garmin' | 'strava' | 'intervals' | 'manual'
    action: string
  }
}

export const DAILY_RECOMMENDATION_ENGINE_VERSION = 'daily-recommendation-v1'

function formatTarget(goal?: Goal): string {
  if (!goal) return 'No active goal loaded'
  return goal.targetDate ? `${goal.name} · ${goal.targetDate}` : goal.name
}

function connectAction(input: { recoveryMissing: boolean; activityProofSparse: boolean }): DailyRecommendation['connect'] {
  if (input.recoveryMissing) return { primary: 'garmin', action: 'Connect/import Garmin recovery first; daily advice is weaker without readiness, HRV, sleep, and Body Battery.' }
  if (input.activityProofSparse) return { primary: 'strava', action: 'Connect/import Strava proof next; AERION needs completed routes and rides/runs to stop guessing.' }
  return { primary: 'intervals', action: 'Keep Intervals sync fresh; it is the training-load and event backbone.' }
}

export function buildDailyRecommendation(input: {
  recommendation: WorkoutRecommendation
  briefing: CoachBriefing
  morningReadiness: MorningReadinessVerdict
  next72Plan: Next72Plan
  activeGoal?: Goal
  readiness?: GoalReadinessResult
  path?: PathToGoal
  trajectory: TrajectoryEngineOutput
  learning: LearningEngineOutput
  nextRace?: Race
  recoveryMissing?: boolean
  activityProofSparse?: boolean
}): DailyRecommendation {
  const { recommendation, briefing, morningReadiness, next72Plan, activeGoal, readiness, path, trajectory, learning, nextRace } = input
  const primary = recommendation.primary
  const learningAdjustment = learning.recommendedPolicyAdjustments[0]
  const goalFocus = path?.nextFocus[0] ?? readiness?.mainLimiter ?? 'Load an active goal so AERION can steer beyond today.'
  const weekStructure = path?.suggestedStructure ?? [next72Plan.summary, 'Re-check readiness before adding intensity', 'Keep fixed races in the model']
  const weekAvoid = path?.avoid ?? ['stacking intensity', 'turning missed volume into panic work']
  const safeNext = briefing.readinessAdjustment?.safeNextAction ?? briefing.nextAction

  return {
    engineVersion: DAILY_RECOMMENDATION_ENGINE_VERSION,
    headline: `${primary.title} · ${primary.durationMin || 'Off'} min`,
    today: {
      action: primary.title,
      durationMin: primary.durationMin,
      intensity: primary.intensity,
      safeNext,
      reason: morningReadiness.reasons[0] ?? briefing.dominantConstraint,
      consequence: briefing.consequence,
    },
    goal: {
      name: formatTarget(activeGoal),
      status: activeGoal?.status ?? 'missing',
      readiness: readiness?.overallReadiness,
      phase: path?.phase,
      limiter: readiness?.mainLimiter,
      nextFocus: goalFocus,
    },
    week: {
      focus: path?.nextFocus.join(' · ') ?? next72Plan.summary,
      structure: weekStructure.slice(0, 3),
      avoid: weekAvoid.slice(0, 3),
      risk: next72Plan.risk,
    },
    longTerm: {
      direction: trajectory.direction,
      readinessRange: trajectory.readinessRange,
      stance: nextRace
        ? `Protect ${nextRace.name}; long-term progression only counts if the next fixed marker stays viable.`
        : learningAdjustment ?? 'Build repeatable aerobic frequency before adding complexity.',
    },
    connect: connectAction({ recoveryMissing: input.recoveryMissing ?? false, activityProofSparse: input.activityProofSparse ?? false }),
  }
}
