import type { Goal, GoalConversationEntry } from '../domain/types'
import type { GoalFeasibilityBrief } from './goalFeasibilityEngine'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { PathToGoal } from './pathEngine'

export type GoalPlanningBlock = {
  title: string
  horizonDays: number
  stance: string
  assumptions: string[]
  weeks: Array<{
    label: string
    objective: string
    sessions: string[]
    guardrails: string[]
  }>
  decisionReceipt: string[]
}

type Input = {
  goal?: Goal
  feasibility: GoalFeasibilityBrief
  readiness?: GoalReadinessResult
  path?: PathToGoal
  conversation: GoalConversationEntry[]
}

function extractRecentAnswers(entries: GoalConversationEntry[], goalId?: string): string[] {
  return [...entries]
    .filter((entry) => !goalId || entry.goalId === goalId)
    .filter((entry) => entry.kind === 'answer' || entry.kind === 'constraint' || entry.kind === 'decision')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((entry) => `${entry.kind}: ${entry.text}`)
}

function formatPredictionRange(readiness?: GoalReadinessResult): string {
  if (!readiness) return 'Prediction range unavailable until readiness evidence improves.'
  const { finish, strongFinish, performanceGoal } = readiness.predictedPerformance
  const low = Math.min(finish, strongFinish, performanceGoal)
  const high = Math.max(finish, strongFinish, performanceGoal)
  return `Predicted outcome range ${low}–${high}/100 across performance goal, strong finish, and finish scenarios with ${readiness.confidence} confidence.`
}

export function buildGoalPlanningBlock(input: Input): GoalPlanningBlock {
  const { goal, feasibility, readiness, path, conversation } = input
  const title = goal ? `${goal.name} · adaptive 21-day block` : 'Goal idea · discovery block'
  const baseFocus = path?.nextFocus ?? feasibility.planning.slice(0, 3)
  const constraints = [...(path?.constraints ?? []), ...feasibility.risks].slice(0, 5)
  const answers = extractRecentAnswers(conversation, goal?.id)
  const recoveryFirst = feasibility.stance === 'blocked-by-recovery' || path?.phase === 'Recovery / Reset'
  const foundation = feasibility.stance === 'too-early' || path?.phase === 'Foundation'

  const week1Objective = recoveryFirst
    ? 'Stabilize recovery and collect signal quality before progression.'
    : foundation
      ? 'Establish repeatable low-cost frequency and gather evidence.'
      : baseFocus[0] ?? 'Execute the safest high-leverage focus.'

  const week2Objective = recoveryFirst
    ? 'Reintroduce aerobic rhythm only if readiness improves.'
    : baseFocus[1] ?? 'Progress volume cautiously while protecting recovery.'

  const week3Objective = recoveryFirst
    ? 'Reassess commitment after recovery trend is no longer red.'
    : baseFocus[2] ?? 'Convert evidence into a commit / hold / drop decision.'

  return {
    title,
    horizonDays: 21,
    stance: feasibility.headline,
    assumptions: [
      readiness ? `Readiness ${readiness.overallReadiness}/100 with ${readiness.confidence} confidence.` : 'Readiness confidence is limited until more evidence is available.',
      formatPredictionRange(readiness),
      path?.phase ? `Current phase: ${path.phase}.` : 'No stable phase yet; defaulting to discovery.',
      answers.length ? `Recent goal conversation entries: ${answers.join(' · ')}` : 'No founder answers captured yet; plan remains provisional.',
      'Actual completed work will override this block.',
    ],
    weeks: [
      {
        label: 'Days 1–7',
        objective: week1Objective,
        sessions: recoveryFirst
          ? ['2–4 recovery/easy movement sessions only if signals improve', '1 readiness check-in after any work', 'No intensity experiments']
          : ['3–5 aerobic sessions', '1 longer controlled endurance touch', '1 constraint answer/update in AERION'],
        guardrails: constraints.slice(0, 3),
      },
      {
        label: 'Days 8–14',
        objective: week2Objective,
        sessions: recoveryFirst
          ? ['2–3 short Z1/Z2 sessions if recovery exits red', 'No stacked fatigue', 'Re-test feasibility stance']
          : ['Maintain frequency', 'Add one goal-specific durability touch if recovery is green/yellow', 'Log actual constraint changes'],
        guardrails: constraints.slice(1, 4),
      },
      {
        label: 'Days 15–21',
        objective: week3Objective,
        sessions: ['Decision week: commit, keep candidate, or park', 'Compare actuals vs block intent', 'Update target date/status if evidence changed'],
        guardrails: constraints.slice(2, 5),
      },
    ],
    decisionReceipt: [
      feasibility.feasibility,
      feasibility.planning[0] ?? 'Planning move unavailable',
      feasibility.risks[0] ?? 'Primary risk unavailable',
      'Predictions are ranges, not certainty.',
    ],
  }
}
