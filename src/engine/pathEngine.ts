import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { isRaceLikeActivity } from './timelineEngine'

export type PathPhase = 'Foundation' | 'Build' | 'Specific' | 'Peak' | 'Recovery / Reset'

export type PathToGoal = {
  goalId: string
  goalName: string
  phase: PathPhase
  nextFocus: string[]
  suggestedStructure: string[]
  constraints: string[]
  avoid: string[]
  adaptationNotes: string[]
  overrideReason?: string
}

type Input = {
  goal: Goal
  today: string
  readinessScore: number
  state: CurrentState
  activities: Activity[]
  races: Race[]
}

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

function recentActivities(activities: Activity[], today: string): Activity[] {
  return activities.filter((activity) => withinDays(activity, today, 21))
}

function hasRecentHighCostRace(activities: Activity[], today: string): boolean {
  return recentActivities(activities, today).some((activity) => isRaceLikeActivity(activity) && ((activity.raceCost ?? activity.load ?? 0) >= 75 || activity.raceCostBand === 'High' || activity.raceCostBand === 'Extreme'))
}

function mandatoryRaceSoon(races: Race[], today: string): boolean {
  return races.some((race) => race.mandatory && race.priority === 'fixed' && (daysBetween(today, race.date) ?? 999) >= 0 && (daysBetween(today, race.date) ?? 999) <= 7)
}

function determinePhase(input: Input): { phase: PathPhase; overrideReason?: string } {
  const { goal, today, readinessScore, state, activities } = input
  if (state.injury_present || state.illness_present || state.recovery_status === 'red' || (state.recovery_score ?? 100) < 40) {
    return { phase: 'Recovery / Reset', overrideReason: 'Recovery overrides goal path before readiness work.' }
  }
  if (hasRecentHighCostRace(activities, today)) return { phase: 'Recovery / Reset' }
  const daysToGoal = daysBetween(today, goal.targetDate)
  if (daysToGoal !== null && daysToGoal <= 21 && readinessScore >= 65) return { phase: 'Peak' }
  if (daysToGoal !== null && daysToGoal <= 56 && readinessScore >= 55) return { phase: 'Specific' }
  if (readinessScore < 45 || goal.status === 'draft') return { phase: 'Foundation' }
  return { phase: 'Build' }
}

function focusFor(goal: Goal, phase: PathPhase, mandatorySoon: boolean): string[] {
  if (phase === 'Recovery / Reset') return ['restore recovery signal quality', 'absorb recent work', 'restart with low-cost aerobic frequency']
  if (mandatorySoon) return ['arrive fresh for fixed race execution', 'maintain aerobic rhythm', 'avoid optional fatigue']
  if (goal.discipline === 'triathlon') {
    if (phase === 'Foundation') return ['establish repeatable aerobic frequency', 'restore swim-bike-run consistency', 'protect recovery']
    if (phase === 'Specific') return ['extend race-specific endurance', 'practice brick tolerance', 'validate fueling under controlled load']
    if (phase === 'Peak') return ['preserve freshness', 'maintain race feel', 'avoid durability experiments']
    return ['increase bike endurance', 'maintain run durability', 'protect recovery']
  }
  if (goal.discipline === 'running') return ['improve pace at low HR', 'increase run frequency gradually', 'watch HR drift and recovery']
  return phase === 'Foundation'
    ? ['establish repeatable aerobic frequency', 'build long ride habit', 'protect recovery']
    : ['increase bike endurance', 'build power durability carefully', 'validate fueling tolerance']
}

function structureFor(goal: Goal, phase: PathPhase): string[] {
  if (phase === 'Recovery / Reset') return ['2–4 easy movement sessions only if recovery responds', '1–2 full rest days', 'no progression until fatigue signal improves']
  if (phase === 'Peak') return ['2–4 short aerobic sessions', '1 controlled opener only if recovery is green', 'races allowed; count as intensity']
  if (goal.discipline === 'running') return ['3–5 low-HR runs or run-walk sessions', '1 longer easy run progression', 'bike support only if it does not compromise run recovery']
  if (goal.discipline === 'triathlon') return ['3–5 Z2 sessions', '1 long session progression', '1 brick tolerance touch if recovery is green', 'races allowed; count as intensity']
  return ['3–5 Z2 sessions', '1 long session progression', 'races allowed; count as intensity']
}

function constraintsFor(phase: PathPhase, mandatorySoon: boolean): string[] {
  const constraints = ['avoid stacking intensity', 'no strength within 24h before race', 'protect recovery after high race cost']
  if (phase === 'Peak') constraints.push('protect freshness over extra fitness')
  if (mandatorySoon) constraints.push('mandatory race calendar overrides optional goal work')
  if (phase === 'Recovery / Reset') constraints.push('do not resume build work until recovery trend improves')
  return constraints
}

function avoidFor(phase: PathPhase, state: CurrentState): string[] {
  const avoid = ['excessive tempo work', 'overloading run volume too quickly']
  if (phase === 'Foundation') avoid.push('adding intensity to compensate for missing volume')
  if (phase === 'Recovery / Reset' || state.recovery_status === 'red') avoid.push('forcing goal work while recovery is red')
  return avoid
}

function adaptationNotes(input: Input): string[] {
  const recent = recentActivities(input.activities, input.today)
  const notes = ['Path recalculated from actual activity history']
  if (recent.length === 0) notes.push('Low recent activity volume; rebuild from what happened, not from the intended plan')
  if (hasRecentHighCostRace(input.activities, input.today)) notes.push('Recent high-cost race detected; recovery protection comes before extra goal work')
  if (input.state.hrv_trend === 'declining') notes.push('Declining HRV trend lowers tolerance for progression')
  if (input.state.hrv_trend === 'improving') notes.push('Improving HRV trend may support cautious progression')
  return notes
}

export function buildPathToGoal(input: Input): PathToGoal {
  const { goal } = input
  const phaseResult = determinePhase(input)
  const mandatorySoon = mandatoryRaceSoon(input.races, input.today)
  return {
    goalId: goal.id,
    goalName: goal.name,
    phase: phaseResult.phase,
    nextFocus: focusFor(goal, phaseResult.phase, mandatorySoon),
    suggestedStructure: structureFor(goal, phaseResult.phase),
    constraints: constraintsFor(phaseResult.phase, mandatorySoon),
    avoid: avoidFor(phaseResult.phase, input.state),
    adaptationNotes: adaptationNotes(input),
    overrideReason: phaseResult.overrideReason,
  }
}
