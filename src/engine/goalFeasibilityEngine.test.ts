import { describe, expect, it } from 'vitest'
import type { CurrentState, Goal, Race } from '../domain/types'
import { buildGoalFeasibilityBrief } from './goalFeasibilityEngine'

const baseState: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'green', recovery_score: 78 }
const goal: Goal = { id: 'g1', name: 'Ironman Lanzarote', type: 'candidate-event', discipline: 'triathlon', status: 'candidate', targetDate: '2026-10-01' }
const races: Race[] = [{ id: 'r1', date: '2026-08-01', name: 'Fixed Race', discipline: 'cycling', priority: 'fixed', mandatory: true }]

describe('buildGoalFeasibilityBrief', () => {
  it('gives a feasible stance when readiness is high and runway exists', () => {
    const brief = buildGoalFeasibilityBrief({ goal, state: baseState, races, today: '2026-07-27', readiness: { goalId: goal.id, goalName: goal.name, statusLabel: 'candidate', overallReadiness: 76, readyToCommit: true, confidence: 'medium', dimensions: [], predictedPerformance: { finish: 80, strongFinish: 64, performanceGoal: 48 }, predictionSummary: 'finish likely', scenarios: { currentTrend: { label: 'Current', outcome: 'finish likely', risk: 'manageable' }, recommendedPlan: { label: 'Plan', outcome: 'strong finish possible', risk: 'lower' }, overload: { label: 'Overload', outcome: 'uncertain', risk: 'high' } }, limitingFactors: [], mainLimiter: 'No dominant limiter', nextRecommendedPhase: 'Build', commitmentAdvice: 'Ready cautiously', evidence: [] } })

    expect(brief.stance).toBe('feasible')
    expect(brief.headline).toContain('Feasible')
  })

  it('lets recovery veto ambition without deleting the goal', () => {
    const brief = buildGoalFeasibilityBrief({ goal, state: { ...baseState, recovery_status: 'red', recovery_score: 30 }, races, today: '2026-07-27' })

    expect(brief.stance).toBe('blocked-by-recovery')
    expect(brief.risks.join(' ')).toContain('recovery')
  })

  it('keeps fixed races on the planning table during non-injury recovery limits', () => {
    const fixedGoal: Goal = { ...goal, type: 'fixed-date-race', status: 'committed', targetDate: '2026-08-05' }
    const brief = buildGoalFeasibilityBrief({ goal: fixedGoal, state: { ...baseState, recovery_status: 'red', recovery_score: 30 }, races, today: '2026-07-27' })

    expect(brief.stance).toBe('possible-with-constraints')
    expect(brief.planning.join(' ')).toContain('not the existence of the event')
    expect(brief.risks.join(' ')).toContain('execution conservative')
    expect(brief.questions.join(' ')).not.toContain('date truly fixed')
  })

  it('allows injury or illness to override even a fixed race', () => {
    const fixedGoal: Goal = { ...goal, type: 'mandatory-race', status: 'mandatory', targetDate: '2026-08-05' }
    const brief = buildGoalFeasibilityBrief({ goal: fixedGoal, state: { ...baseState, illness_present: true }, races, today: '2026-07-27' })

    expect(brief.stance).toBe('blocked-by-recovery')
    expect(brief.risks.join(' ')).toContain('Injury or illness')
  })
})
