import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GoalReadinessResult } from '../engine/goalReadinessEngine'
import type { PathToGoal } from '../engine/pathEngine'
import { PathToGoalPanel } from './PathToGoalPanel'

const readiness: GoalReadinessResult = {
  goalId: 'im-lanzarote',
  goalName: 'Ironman Lanzarote',
  statusLabel: 'Building toward goal',
  overallReadiness: 61,
  readyToCommit: false,
  confidence: 'medium',
  dimensions: [
    { label: 'bike endurance', score: 70, note: 'Long ride capacity visible' },
    { label: 'run durability', score: 42, note: 'Limiter after long bike' },
  ],
  predictedPerformance: { finish: 61, strongFinish: 42, performanceGoal: 28 },
  predictionSummary: 'Current trend: finish possible, high fatigue risk',
  scenarios: {
    currentTrend: { label: 'Current trend', outcome: 'finish possible', risk: 'high fatigue risk' },
    recommendedPlan: { label: 'Recommended path', outcome: 'finish likely', risk: 'manageable fatigue risk' },
    overload: { label: 'Overload / non-compliance', outcome: 'fitness may rise briefly', risk: 'high fatigue and durability risk' },
  },
  limitingFactors: ['Run durability after long bike'],
  mainLimiter: 'Run durability after long bike',
  nextRecommendedPhase: '12-week base + durability block',
  commitmentAdvice: 'Do not set race date yet. Reassess after 6 weeks of stable training.',
  evidence: ['Actual activity history used as source of truth'],
}

const path: PathToGoal = {
  goalId: 'im-lanzarote',
  goalName: 'Ironman Lanzarote',
  phase: 'Build',
  nextFocus: ['increase bike endurance', 'maintain run durability', 'protect recovery'],
  suggestedStructure: ['3–5 Z2 sessions', '1 long session progression', 'races allowed; count as intensity'],
  constraints: ['avoid stacking intensity', 'no strength within 24h before race'],
  avoid: ['excessive tempo work'],
  adaptationNotes: ['Path recalculated from actual activity history'],
}

describe('PathToGoalPanel', () => {
  it('renders readiness, uncertainty, scenarios, and adaptive path guidance', () => {
    const markup = renderToStaticMarkup(<PathToGoalPanel readiness={readiness} path={path} />)

    expect(markup).toContain('PATH TO GOAL')
    expect(markup).toContain('Ironman Lanzarote')
    expect(markup).toContain('Finish: 61%')
    expect(markup).toContain('Strong finish: 42%')
    expect(markup).toContain('Performance goal: 28%')
    expect(markup).toContain('Confidence: medium')
    expect(markup).toContain('Run durability after long bike')
    expect(markup).toContain('Ready to commit: no')
    expect(markup).toContain('3–5 Z2 sessions')
    expect(markup).toContain('Current trend')
    expect(markup).toContain('Recommended path')
    expect(markup).toContain('Overload / non-compliance')
    expect(markup).toContain('Predictions are ranges, not certainty')
    expect(markup).not.toMatch(/guaranteed/i)
  })
})
