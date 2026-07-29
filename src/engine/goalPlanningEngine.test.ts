import { describe, expect, it } from 'vitest'
import type { Goal, GoalConversationEntry } from '../domain/types'
import type { GoalFeasibilityBrief } from './goalFeasibilityEngine'
import { buildGoalPlanningBlock } from './goalPlanningEngine'

const goal: Goal = { id: 'g1', name: 'Ironman Lanzarote', type: 'candidate-event', status: 'candidate', discipline: 'triathlon', targetDate: '2026-10-01' }
const feasible: GoalFeasibilityBrief = {
  stance: 'possible-with-constraints',
  headline: 'Possible, but only if constraints are respected.',
  feasibility: 'finish possible · floating confidence',
  planning: ['Build repeatable aerobic frequency', 'Practice brick tolerance', 'Validate fueling'],
  risks: ['Recovery is currently limiting safe progression', 'Run durability after long bike'],
  questions: ['Is the date fixed?'],
}
const conversation: GoalConversationEntry[] = [{ id: 'c1', goalId: 'g1', createdAt: '2026-07-27T10:00:00.000Z', kind: 'answer', text: 'I can train 8 hours per week.' }]
const readiness = {
  goalId: 'g1',
  goalName: goal.name,
  statusLabel: 'Building toward goal',
  overallReadiness: 68,
  readyToCommit: false,
  confidence: 'medium' as const,
  dimensions: [],
  predictedPerformance: { finish: 76, strongFinish: 56, performanceGoal: 40 },
  predictionSummary: 'finish possible',
  scenarios: {
    currentTrend: { label: 'Current', outcome: 'finish possible', risk: 'manageable' },
    recommendedPlan: { label: 'Plan', outcome: 'strong finish possible', risk: 'lower' },
    overload: { label: 'Overload', outcome: 'uncertain', risk: 'high' },
  },
  limitingFactors: [],
  mainLimiter: 'No dominant limiter',
  nextRecommendedPhase: 'Build',
  commitmentAdvice: 'Reassess after stable training',
  evidence: [],
}

describe('buildGoalPlanningBlock', () => {
  it('creates a provisional adaptive 21 day block from feasibility and answers', () => {
    const block = buildGoalPlanningBlock({ goal, feasibility: feasible, conversation })

    expect(block.horizonDays).toBe(21)
    expect(block.title).toContain('Ironman Lanzarote')
    expect(block.assumptions.join(' ')).toContain('8 hours')
    expect(block.weeks).toHaveLength(3)
    expect(block.decisionReceipt.join(' ')).toContain('ranges')
  })

  it('uses recovery-first sessions when feasibility is recovery blocked', () => {
    const block = buildGoalPlanningBlock({ goal, feasibility: { ...feasible, stance: 'blocked-by-recovery', headline: 'Blocked by recovery.' }, conversation: [] })

    expect(block.weeks[0].objective).toContain('recovery')
    expect(block.weeks[0].sessions.join(' ')).toContain('No intensity')
  })

  it('uses only conversation answers for the active goal', () => {
    const block = buildGoalPlanningBlock({
      goal,
      feasibility: feasible,
      conversation: [
        { id: 'old-other', goalId: 'other', createdAt: '2026-07-27T12:00:00.000Z', kind: 'answer', text: 'Use the other goal answer.' },
        { id: 'note', goalId: 'g1', createdAt: '2026-07-27T11:00:00.000Z', kind: 'note', text: 'Unstructured note should not drive the plan.' },
        { id: 'answer', goalId: 'g1', createdAt: '2026-07-27T10:00:00.000Z', kind: 'constraint', text: 'Race date is fixed by travel.' },
      ],
    })

    const assumptions = block.assumptions.join(' ')
    expect(assumptions).toContain('Race date is fixed by travel')
    expect(assumptions).not.toContain('other goal')
    expect(assumptions).not.toContain('Unstructured note')
  })

  it('states predictions as a range with confidence rather than a certain outcome', () => {
    const block = buildGoalPlanningBlock({ goal, feasibility: feasible, conversation, readiness })
    const text = [...block.assumptions, ...block.decisionReceipt].join(' ')

    expect(text).toContain('range 40–76/100')
    expect(text).toContain('medium confidence')
    expect(text).toContain('Predictions are ranges, not certainty')
    expect(text.toLowerCase()).not.toContain('guaranteed')
  })
})
