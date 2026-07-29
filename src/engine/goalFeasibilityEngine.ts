import type { CurrentState, Goal, Race } from '../domain/types'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { PathToGoal } from './pathEngine'

type Input = {
  goal?: Goal
  readiness?: GoalReadinessResult
  path?: PathToGoal
  state: CurrentState
  races: Race[]
  today: string
}

export type GoalFeasibilityBrief = {
  stance: 'feasible' | 'possible-with-constraints' | 'too-early' | 'blocked-by-recovery'
  headline: string
  feasibility: string
  planning: string[]
  risks: string[]
  questions: string[]
}

function daysBetween(from: string, to?: string | null): number | null {
  if (!to) return null
  const start = new Date(`${from}T00:00:00Z`).getTime()
  const end = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((end - start) / 86_400_000)
}

function raceDensity(races: Race[], today: string): number {
  return races.filter((race) => {
    const days = daysBetween(today, race.date)
    return days !== null && days >= 0 && days <= 21
  }).length
}

export function buildGoalFeasibilityBrief(input: Input): GoalFeasibilityBrief {
  const { goal, readiness, path, state, races, today } = input
  if (!goal) {
    return {
      stance: 'too-early',
      headline: 'Enter a race, goal, or idea and AERION will pressure-test it.',
      feasibility: 'No active goal selected yet. Add a candidate event, floating target, or committed race to start the feasibility conversation.',
      planning: ['Capture the idea first', 'Add date only if the date is real', 'Keep it candidate until evidence supports commitment'],
      risks: ['No feasibility model can run without at least a goal name and discipline'],
      questions: ['What is the event or idea?', 'Is the date fixed or flexible?', 'Is this cycling, running, triathlon, or general endurance?'],
    }
  }

  const score = readiness?.overallReadiness ?? state.recovery_score ?? 50
  const daysToGoal = daysBetween(today, goal.targetDate)
  const density = raceDensity(races, today)
  const injuryOrIllness = state.injury_present || state.illness_present
  const recoveryLimited = state.recovery_status === 'red' || (state.recovery_score ?? 100) < 40
  const recoveryBlocked = injuryOrIllness || recoveryLimited
  const fixedRace = goal.type === 'fixed-date-race' || goal.type === 'committed-race' || goal.type === 'mandatory-race' || goal.status === 'committed' || goal.status === 'key-event' || goal.status === 'mandatory'
  const shortWindow = daysToGoal !== null && daysToGoal < 42
  const highDensity = density >= 3

  const stance: GoalFeasibilityBrief['stance'] = injuryOrIllness
    ? 'blocked-by-recovery'
    : recoveryLimited
      ? fixedRace
        ? 'possible-with-constraints'
        : 'blocked-by-recovery'
      : fixedRace && shortWindow
        ? 'possible-with-constraints'
        : score >= 72 && !shortWindow
          ? 'feasible'
          : score >= 50 || !goal.targetDate || fixedRace
            ? 'possible-with-constraints'
            : 'too-early'

  const headline = stance === 'feasible'
    ? 'Feasible. Commit cautiously and let actual training keep veto power.'
    : stance === 'possible-with-constraints'
      ? 'Possible, but only if the plan respects the current constraints.'
      : stance === 'blocked-by-recovery'
        ? 'Not blocked forever. Blocked by current recovery reality.'
        : 'Too early to commit. Keep it as an idea until evidence improves.'

  const feasibility = `${goal.name}: ${readiness?.predictionSummary ?? 'readiness evidence is still limited'}${daysToGoal !== null ? ` · ${daysToGoal} days out` : ' · floating date'}.`

  const planning = [
    path?.phase ? `Current path phase: ${path.phase}` : 'Start with a Foundation block until evidence improves',
    ...(path?.nextFocus.slice(0, 3) ?? ['build repeatable aerobic frequency', 'protect recovery', 'collect better evidence']),
    fixedRace ? 'Fixed/committed status means adjust execution and recovery cost, not the existence of the event.' : 'Keep this as candidate until readiness and recovery trend agree.',
  ]

  const risks = [
    ...(readiness?.limitingFactors.slice(0, 3) ?? ['Missing goal-specific data limits confidence']),
    ...(shortWindow ? [fixedRace ? 'Short runway: protect freshness and execution because the race remains on the calendar.' : 'Short runway: commitment risk is high unless the event is mandatory.'] : []),
    ...(highDensity ? ['Race density in the next 21 days reduces optional build space.'] : []),
    ...(injuryOrIllness ? ['Injury or illness can override even a fixed race until health status changes.'] : recoveryLimited ? ['Current recovery state overrides ambition; keep execution conservative until signals improve.'] : []),
  ]

  const questions = [
    ...(fixedRace ? [] : [goal.targetDate ? 'Is the date truly fixed, or just desirable?' : 'Do you want this to stay floating, or should AERION search for a target event window?']),
    'What outcome matters: finish, strong finish, podium/time target, or just experience?',
    'What constraint is non-negotiable: recovery, work/travel, race calendar, or available weekly hours?',
  ]

  return { stance, headline, feasibility, planning, risks, questions }
}
