import { describe, expect, it } from 'vitest'
import type { Goal, Race, WorkoutRecommendation } from '../domain/types'
import type { CoachBriefing } from './coachBriefingEngine'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { LearningEngineOutput } from './learningEngine'
import type { MorningReadinessVerdict } from './morningReadinessEngine'
import type { PathToGoal } from './pathEngine'
import type { Next72Plan } from './recoveryPlanEngine'
import type { TrajectoryEngineOutput } from './trajectoryEngine'
import { buildDailyRecommendation } from './dailyRecommendationEngine'

const recommendation: WorkoutRecommendation = {
  primary: { discipline: 'run', title: 'Low-HR endurance run', durationMin: 45, intensity: 'z2', purpose: 'Build marathon durability', steps: [], cautions: [] },
  goalReminder: 'Amsterdam sub-3 remains the north star.',
  longTermBias: 'Build repeatable frequency.',
}

const briefing = {
  nextAction: 'Keep HR capped and stop if drift rises.',
  consequence: 'If you exceed the cap, you spend the next 48–72h recovery budget.',
  dominantConstraint: 'run durability',
  confidence: 'medium',
  headline: 'Controlled build.',
  status: 'Green.',
  recommendation: 'Run',
  tone: 'green',
  missingSignals: [],
} as CoachBriefing

const morningReadiness = {
  verdict: 'Ready',
  primaryAction: 'Proceed capped',
  reasons: ['Recovery signal is usable'],
} as unknown as MorningReadinessVerdict

const next72Plan = { summary: 'Keep load controlled.', risk: 'Medium', blocks: [] } as Next72Plan
const goal: Goal = { id: 'sub-3', name: 'Amsterdam Marathon sub-3', type: 'fixed-date-race', discipline: 'running', status: 'committed', targetDate: '2026-10-18' }
const readiness = { overallReadiness: 62, mainLimiter: 'low-HR pace durability' } as GoalReadinessResult
const path = { phase: 'Build', nextFocus: ['improve pace at low HR', 'increase run frequency gradually'], suggestedStructure: ['3–5 low-HR runs', '1 longer easy run', 'bike support only if it does not compromise run recovery'], avoid: ['overloading run volume too quickly'] } as PathToGoal
const trajectory = { direction: 'stable', readinessRange: { low: 58, high: 70 } } as TrajectoryEngineOutput
const learning = { recommendedPolicyAdjustments: ['Bias toward capped aerobic work.'] } as LearningEngineOutput
const nextRace: Race = { id: 'race-1', date: '2026-08-10', name: 'Tune-up 10k', discipline: 'running', priority: 'fixed', mandatory: true }

describe('buildDailyRecommendation', () => {
  it('combines today, active goal, week, and long-term trajectory into one recommendation', () => {
    const result = buildDailyRecommendation({ recommendation, briefing, morningReadiness, next72Plan, activeGoal: goal, readiness, path, trajectory, learning, nextRace })

    expect(result.engineVersion).toBe('daily-recommendation-v1')
    expect(result.today.action).toBe('Low-HR endurance run')
    expect(result.goal.name).toContain('Amsterdam Marathon sub-3')
    expect(result.goal.readiness).toBe(62)
    expect(result.week.structure).toContain('1 longer easy run')
    expect(result.longTerm.readinessRange).toEqual({ low: 58, high: 70 })
    expect(result.longTerm.stance).toContain('Tune-up 10k')
  })

  it('prioritizes Garmin connect when recovery evidence is missing', () => {
    const result = buildDailyRecommendation({ recommendation, briefing, morningReadiness, next72Plan, trajectory, learning, recoveryMissing: true })

    expect(result.connect.primary).toBe('garmin')
    expect(result.connect.action).toContain('Garmin recovery')
  })

  it('prioritizes Strava proof when activity evidence is sparse', () => {
    const result = buildDailyRecommendation({ recommendation, briefing, morningReadiness, next72Plan, trajectory, learning, activityProofSparse: true })

    expect(result.connect.primary).toBe('strava')
    expect(result.connect.action).toContain('Strava proof')
  })
})
