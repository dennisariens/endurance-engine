import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { isRaceLikeActivity } from './timelineEngine'

export type GoalConfidence = 'low' | 'medium' | 'high'

export type GoalReadinessDimension = {
  label: string
  score: number
  note: string
}

export type GoalScenario = {
  label: string
  outcome: string
  risk: string
}

export type GoalReadinessResult = {
  goalId: string
  goalName: string
  statusLabel: string
  overallReadiness: number
  readyToCommit: boolean
  confidence: GoalConfidence
  dimensions: GoalReadinessDimension[]
  predictedPerformance: {
    finish: number
    strongFinish: number
    performanceGoal: number
  }
  predictionSummary: string
  scenarios: {
    currentTrend: GoalScenario
    recommendedPlan: GoalScenario
    overload: GoalScenario
  }
  limitingFactors: string[]
  mainLimiter: string
  nextRecommendedPhase: string
  commitmentAdvice: string
  evidence: string[]
}

type Input = {
  goal: Goal
  today: string
  activities: Activity[]
  races: Race[]
  state: CurrentState
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

function daysBetween(from: string, to?: string | null): number | null {
  if (!to) return null
  const start = new Date(`${from}T00:00:00Z`).getTime()
  const end = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((end - start) / 86_400_000)
}

function withinDays(activity: Activity, today: string, days: number): boolean {
  const diff = daysBetween(activity.date, today)
  return diff !== null && diff >= 0 && diff <= days
}

function isBike(activity: Activity): boolean {
  return /ride|bike|cycling|virtualride/i.test(activity.type) || /ride|bike|cycling|zwift/i.test(activity.name)
}

function isRun(activity: Activity): boolean {
  return /run|running/i.test(activity.type) || /run|running/i.test(activity.name)
}

function isSwim(activity: Activity): boolean {
  return /swim/i.test(activity.type) || /swim/i.test(activity.name)
}

function isBrick(activity: Activity): boolean {
  return /brick/i.test(activity.name) || /bike-run|run off bike/i.test(activity.name)
}

function minutes(activity: Activity): number {
  return (activity.durationSec ?? 0) / 60
}

function recentActivities(activities: Activity[], today: string): Activity[] {
  return activities.filter((activity) => withinDays(activity, today, 42))
}

function scoreFrequency(count: number, target: number): number {
  return clamp((count / target) * 100)
}

function scoreDuration(maxMinutes: number, targetMinutes: number): number {
  return clamp((maxMinutes / targetMinutes) * 100)
}

function recoveryScore(state: CurrentState): number {
  if (state.injury_present || state.illness_present) return 0
  if (typeof state.recovery_score === 'number') return clamp(state.recovery_score)
  if (state.recovery_status === 'green') return 72
  if (state.recovery_status === 'yellow') return 54
  if (state.recovery_status === 'red') return 30
  return 50
}

function hrvModifier(state: CurrentState): number {
  if (state.hrv_trend === 'improving') return 6
  if (state.hrv_trend === 'declining') return -10
  return 0
}

function buildDimensions(goal: Goal, activities: Activity[], today: string, state: CurrentState): GoalReadinessDimension[] {
  const recent = recentActivities(activities, today)
  const bikes = recent.filter(isBike)
  const runs = recent.filter(isRun)
  const swims = recent.filter(isSwim)
  const bricks = recent.filter(isBrick)
  const longRideMin = bikes.reduce((max, activity) => Math.max(max, minutes(activity)), 0)
  const longRunMin = runs.reduce((max, activity) => Math.max(max, minutes(activity)), 0)
  const weeklyBikeSessions = bikes.length / 6
  const recovery = recoveryScore(state)

  if (goal.discipline === 'triathlon') {
    return [
      { label: 'swim readiness', score: scoreFrequency(swims.length, 6), note: swims.length ? 'Swim work present in recent history' : 'No recent swim evidence loaded' },
      { label: 'bike endurance', score: scoreDuration(longRideMin, 240), note: longRideMin ? `Longest recent ride ${Math.round(longRideMin)} min` : 'No long bike evidence loaded' },
      { label: 'run durability', score: scoreDuration(longRunMin, 90), note: longRunMin ? `Longest recent run ${Math.round(longRunMin)} min` : 'Run durability not yet proven' },
      { label: 'brick tolerance', score: scoreFrequency(bricks.length, 3), note: bricks.length ? 'Brick sessions visible' : 'No recent bike-run bridge loaded' },
      { label: 'recovery capacity', score: recovery, note: `Recovery score ${recovery}/100 with ${state.hrv_trend ?? 'unknown'} HRV trend` },
      { label: 'nutrition durability', score: scoreDuration(longRideMin, 210), note: longRideMin >= 180 ? 'Long sessions can be used to validate fueling' : 'Fueling tolerance needs longer controlled sessions' },
      { label: 'race-specific stress tolerance', score: scoreFrequency(recent.filter(isRaceLikeActivity).length, 2), note: 'Race-like stress is counted, not moralized' },
    ]
  }

  if (goal.discipline === 'running') {
    const lowHrRuns = runs.filter((activity) => typeof activity.avgHr === 'number' ? activity.avgHr <= 145 : true)
    return [
      { label: 'pace at HR', score: scoreFrequency(lowHrRuns.length, 4), note: lowHrRuns.length ? 'Low-HR run frequency visible' : 'Need repeatable low-HR run evidence' },
      { label: 'HR drift', score: typeof state.run_aet === 'number' ? 65 : 45, note: state.run_aet ? 'AeT data available' : 'Drift test not loaded; confidence capped' },
      { label: 'run frequency', score: scoreFrequency(runs.length, 12), note: `${runs.length} recent run(s) loaded` },
      { label: 'durability', score: scoreDuration(longRunMin, 75), note: longRunMin ? `Longest recent run ${Math.round(longRunMin)} min` : 'No durable run loaded' },
      { label: 'recovery after runs', score: recovery, note: `Recovery score ${recovery}/100` },
    ]
  }

  return [
    { label: 'bike endurance score', score: scoreDuration(longRideMin, goal.name.toLowerCase().includes('312') ? 300 : 210), note: longRideMin ? `Longest recent ride ${Math.round(longRideMin)} min` : 'No long ride loaded' },
    { label: 'long ride capacity', score: scoreDuration(longRideMin, 240), note: 'Long ride duration is the main local proxy' },
    { label: 'power durability', score: scoreFrequency(bikes.filter((activity) => (activity.load ?? 0) >= 75).length, 4), note: 'Uses sustained load until power-duration model exists' },
    { label: 'recovery after long rides', score: recovery, note: `Recovery score ${recovery}/100` },
    { label: 'fueling tolerance', score: scoreDuration(longRideMin, 210), note: 'Long sessions are where fueling tolerance becomes observable' },
    { label: 'weekly cycling volume', score: clamp((weeklyBikeSessions / 4) * 100), note: `${bikes.length} recent bike sessions across six weeks` },
  ]
}

function confidenceFor(goal: Goal, dimensions: GoalReadinessDimension[], activities: Activity[], today: string): GoalConfidence {
  const recentCount = recentActivities(activities, today).length
  const missing = dimensions.filter((dimension) => dimension.score < 35).length
  if (recentCount >= 10 && missing <= 1 && goal.targetDate) return 'high'
  if (recentCount >= 2 || goal.discipline === 'running') return 'medium'
  return 'low'
}

function statusLabel(goal: Goal): string {
  if (goal.status === 'mandatory') return 'Mandatory race on calendar'
  if (goal.status === 'key-event') return 'Key event preparation'
  if (goal.status === 'committed') return 'Committed race preparation'
  if (goal.status === 'candidate') return 'Building toward goal'
  return 'Draft goal exploration'
}

function nextPhase(goal: Goal, readiness: number, daysToGoal: number | null): string {
  if (goal.discipline === 'triathlon' && readiness < 65) return '12-week base + durability block'
  if (daysToGoal !== null && daysToGoal <= 21) return 'Peak + freshness block'
  if (readiness < 45) return 'Foundation frequency block'
  if (readiness < 70) return 'Base + durability block'
  return 'Specific preparation block'
}

function commitmentAdvice(goal: Goal, ready: boolean, daysToGoal: number | null, confidence: GoalConfidence): string {
  if (goal.status === 'mandatory' || goal.type === 'mandatory-race') return 'Mandatory race stays on calendar. Adjust execution and recovery cost, not the existence of the event.'
  if (goal.type === 'floating-goal') return 'No race date required. Keep building until the readiness trend is stable enough to select an event.'
  if (ready && confidence !== 'low') return 'Ready to commit cautiously. Keep recalculating from actual training and recovery.'
  if (daysToGoal !== null && daysToGoal < 28) return 'Do not commit unless the event is mandatory. Window is short and uncertainty is high.'
  return 'Do not set race date yet. Reassess after 6 weeks of stable training.'
}

export function evaluateGoalReadiness(input: Input): GoalReadinessResult {
  const { goal, today, activities, state } = input
  const dimensions = buildDimensions(goal, activities, today, state)
  const avg = dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / Math.max(dimensions.length, 1)
  const daysToGoal = daysBetween(today, goal.targetDate)
  const timeModifier = daysToGoal === null ? 0 : daysToGoal < 21 ? -12 : daysToGoal < 56 ? -4 : daysToGoal > 180 ? -2 : 4
  const statusModifier = goal.status === 'mandatory' ? 8 : goal.status === 'key-event' ? 5 : goal.status === 'committed' ? 3 : 0
  const overallReadiness = clamp(avg + timeModifier + statusModifier + hrvModifier(state))
  const limitingFactors = dimensions
    .filter((dimension) => dimension.score < 55)
    .sort((a, b) => a.score - b.score)
    .map((dimension) => dimension.note.includes('No recent swim') ? 'Swim readiness not proven' : dimension.note.includes('Run durability') || dimension.label.includes('run durability') ? 'Run durability after long bike' : `${dimension.label}: ${dimension.note}`)
  if (state.recovery_status === 'red' || (state.recovery_score ?? 100) < 45) limitingFactors.unshift('Recovery is currently limiting safe progression')
  const mainLimiter = limitingFactors[0] ?? 'No dominant limiter visible yet'
  const confidence = confidenceFor(goal, dimensions, activities, today)
  const readyToCommit = goal.status === 'mandatory' || goal.type === 'mandatory-race' || (overallReadiness >= 72 && confidence !== 'low')
  const finish = clamp(overallReadiness + (goal.discipline === 'triathlon' ? 4 : 8))
  const strongFinish = clamp(overallReadiness - 12)
  const performanceGoal = clamp(overallReadiness - 28)
  const currentOutcome = finish >= 70 ? 'finish likely' : finish >= 50 ? 'finish possible' : 'finish uncertain'
  const currentRisk = (state.recovery_status === 'red' || strongFinish < 50) ? 'high fatigue risk' : 'manageable fatigue risk'

  return {
    goalId: goal.id,
    goalName: goal.name,
    statusLabel: statusLabel(goal),
    overallReadiness,
    readyToCommit,
    confidence,
    dimensions,
    predictedPerformance: { finish, strongFinish, performanceGoal },
    predictionSummary: `Current trend: ${currentOutcome}, ${currentRisk}`,
    scenarios: {
      currentTrend: { label: 'Current trend', outcome: currentOutcome, risk: currentRisk },
      recommendedPlan: { label: 'Recommended path', outcome: finish >= 55 ? 'finish likely; strong finish possible' : 'finish becomes more realistic with base work', risk: 'lower fatigue risk if recovery constraints are respected' },
      overload: { label: 'Overload / non-compliance', outcome: 'fitness may rise briefly but durability becomes less predictable', risk: 'high fatigue and recovery-debt risk' },
    },
    limitingFactors: limitingFactors.length ? limitingFactors : ['More goal-specific data required before naming a limiter'],
    mainLimiter,
    nextRecommendedPhase: nextPhase(goal, overallReadiness, daysToGoal),
    commitmentAdvice: commitmentAdvice(goal, readyToCommit, daysToGoal, confidence),
    evidence: ['Actual activity history used as source of truth', 'Predictions are ranges, not certainty', `Confidence is ${confidence}`],
  }
}
