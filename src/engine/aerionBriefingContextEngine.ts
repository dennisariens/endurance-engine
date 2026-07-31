import type { Activity, CurrentState, DecisionLogEntry, Goal, Race } from '../domain/types'
import { buildEvidenceRecords, type EvidenceRecord } from '../data/evidence'
import { buildFreshnessReport, type FreshnessReport } from '../data/freshness'
import { buildCanonicalAthleteState, type CanonicalAthleteState } from '../state/canonicalAthleteState'
import { buildActualOverride } from './actualOverrideEngine'
import { buildCoachBriefing } from './coachBriefingEngine'
import { buildDailyBriefing, type DailyBriefing, type PlannedCalendarEvent } from './dailyBriefingEngine'
import { makeDailyDecision } from './decisionEngine'
import { evaluateGoalReadiness, type GoalReadinessResult } from './goalReadinessEngine'
import { buildMorningReadinessVerdict, type MorningReadinessVerdict } from './morningReadinessEngine'
import { buildPathToGoal, type PathToGoal } from './pathEngine'
import { buildNext72hPlan, type Next72Plan } from './recoveryPlanEngine'
import { buildDashboardStats, type DashboardStats } from './statsEngine'
import { buildLearningEngine, type LearningEngineOutput } from './learningEngine'
import { buildTrajectory, type TrajectoryEngineOutput } from './trajectoryEngine'
import { makeWorkoutRecommendation } from './workoutEngine'

export type AerionBriefingContextInput = {
  date: string
  timezone?: string
  activities: Activity[]
  races: Race[]
  goals: Goal[]
  state: CurrentState
  decisionLog?: DecisionLogEntry[]
  calendarEvents?: PlannedCalendarEvent[]
  syncedAt?: string
  athleteId?: string
  source?: AerionBriefingContext['source']
}

export type AerionBriefingContext = {
  generatedAt: string
  date: string
  timezone: string
  source: 'local-fixture' | 'local-live'
  briefing: DailyBriefing
  coach: DailyBriefing['decision'] & {
    headline: string
    status: string
    recommendation: string
    dominantConstraint: string
    confidence: string
    tone: string
  }
  control: {
    athleteState: CanonicalAthleteState
    evidence: EvidenceRecord[]
    freshness: FreshnessReport
    morningReadiness: MorningReadinessVerdict
    next72Plan: Next72Plan
    goalReadiness?: GoalReadinessResult
    pathToGoal?: PathToGoal
    trajectory: TrajectoryEngineOutput
    learning: LearningEngineOutput
    stats: DashboardStats
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function buildAerionBriefingContext(input: AerionBriefingContextInput): AerionBriefingContext {
  const timezone = input.timezone ?? 'Europe/Amsterdam'
  const generatedAt = new Date().toISOString()
  const athleteId = input.athleteId ?? 'dennis'
  const decisionLog = input.decisionLog ?? []
  const freshness = buildFreshnessReport({ today: input.date, state: input.state, activities: input.activities, races: input.races, syncedAt: input.syncedAt })
  const evidence = buildEvidenceRecords({ athleteId, generatedAt, state: input.state, activities: input.activities, races: input.races, goals: input.goals, freshness })
  const athleteState = buildCanonicalAthleteState({ athleteId, today: input.date, generatedAt, state: input.state, activities: input.activities, races: input.races, goals: input.goals, freshness, evidence })
  const decision = makeDailyDecision({ today: input.date, races: input.races, activities: input.activities, state: input.state })
  const recommendation = makeWorkoutRecommendation({ decision, state: input.state })
  const actualOverride = buildActualOverride({ today: input.date, activities: input.activities, decisionLog, recommendation })
  const yesterdayOverride = buildActualOverride({ today: addDays(input.date, -1), activities: input.activities, decisionLog, recommendation })
  const morningReadiness = buildMorningReadinessVerdict({ today: input.date, state: input.state, yesterdayOverride, athleteState })
  const next72Plan = buildNext72hPlan({ decision, state: input.state, actualOverride, morningReadiness, athleteState })
  const activeGoal = input.goals[0]
  const goalReadiness = activeGoal ? evaluateGoalReadiness({ goal: activeGoal, today: input.date, activities: input.activities, races: input.races, state: input.state }) : undefined
  const pathToGoal = activeGoal && goalReadiness ? buildPathToGoal({ goal: activeGoal, today: input.date, readinessScore: goalReadiness.overallReadiness, state: input.state, activities: input.activities, races: input.races }) : undefined
  const trajectory = buildTrajectory({ athleteState, decision, next72Plan, goalReadiness })
  const learning = buildLearningEngine({ today: input.date, activities: input.activities, decisions: decisionLog, athleteState, trajectory })
  const coachBriefing = buildCoachBriefing({ decision, recommendation, state: input.state, next72Plan, readiness: goalReadiness, morningReadiness, athleteState })
  const briefing = buildDailyBriefing({
    date: input.date,
    timezone,
    recentActivities: input.activities,
    actualOverride,
    decision,
    recommendation,
    next72Plan,
    coachBriefing,
    calendarEvents: input.calendarEvents,
    races: input.races,
  })
  const stats = buildDashboardStats({ today: input.date, races: input.races, activities: input.activities })

  return {
    generatedAt,
    date: input.date,
    timezone,
    source: input.source ?? 'local-fixture',
    briefing,
    coach: {
      ...briefing.decision,
      headline: coachBriefing.headline,
      status: coachBriefing.status,
      recommendation: coachBriefing.recommendation,
      dominantConstraint: coachBriefing.dominantConstraint,
      confidence: coachBriefing.confidence,
      tone: coachBriefing.tone,
    },
    control: {
      athleteState,
      evidence,
      freshness,
      morningReadiness,
      next72Plan,
      goalReadiness,
      pathToGoal,
      trajectory,
      learning,
      stats,
    },
  }
}
