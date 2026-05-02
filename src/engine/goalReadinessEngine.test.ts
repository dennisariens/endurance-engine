import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal } from '../domain/types'
import { evaluateGoalReadiness } from './goalReadinessEngine'

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  recovery_score: 72,
  hrv_trend: 'stable',
  sleep_score: 78,
  eftp_watts: 235,
}

const bikeActivities: Activity[] = [
  { id: 'ride-1', source: 'manual', date: '2026-04-25', name: 'Long endurance ride', type: 'Ride', durationSec: 4 * 3600, load: 120, avgHr: 132 },
  { id: 'ride-2', source: 'manual', date: '2026-04-27', name: 'Z2 ride', type: 'Ride', durationSec: 90 * 60, load: 55, avgHr: 128 },
  { id: 'ride-3', source: 'manual', date: '2026-04-30', name: 'Tempo durability', type: 'Ride', durationSec: 2 * 3600, load: 85, avgHr: 145 },
]

describe('goalReadinessEngine', () => {
  it('scores a fixed-date cycling endurance goal with uncertainty and commit advice', () => {
    const goal: Goal = {
      id: 'mallorca-312',
      name: 'Mallorca 312',
      type: 'fixed-date-race',
      discipline: 'cycling',
      status: 'candidate',
      targetDate: '2026-06-01',
      description: 'Train toward Mallorca 312',
    }

    const result = evaluateGoalReadiness({ goal, today: '2026-05-01', activities: bikeActivities, races: [], state })

    expect(result.goalName).toBe('Mallorca 312')
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    expect(result.overallReadiness).toBeLessThanOrEqual(100)
    expect(result.predictedPerformance.finish).toBeGreaterThan(result.predictedPerformance.strongFinish)
    expect(result.predictedPerformance.strongFinish).toBeGreaterThanOrEqual(result.predictedPerformance.performanceGoal)
    expect(result.confidence).toMatch(/low|medium|high/)
    expect(result.commitmentAdvice).toContain('Reassess')
    expect(result.readyToCommit).toBe(false)
    expect(result.limitingFactors.length).toBeGreaterThan(0)
  })

  it('keeps mandatory races commit-ready while flagging recovery risk', () => {
    const goal: Goal = {
      id: 'ecro-block',
      name: 'ECRO multi-day block',
      type: 'mandatory-race',
      discipline: 'cycling',
      status: 'mandatory',
      targetDate: '2026-05-08',
    }

    const result = evaluateGoalReadiness({
      goal,
      today: '2026-05-01',
      activities: bikeActivities,
      races: [],
      state: { ...state, recovery_status: 'red', recovery_score: 38, hrv_trend: 'declining' },
    })

    expect(result.readyToCommit).toBe(true)
    expect(result.commitmentAdvice).toContain('Mandatory race stays on calendar')
    expect(result.limitingFactors.join(' ')).toContain('Recovery')
    expect(result.scenarios.overload.risk).toContain('fatigue')
  })

  it('evaluates floating low-HR running goals without pretending there is a fixed date', () => {
    const goal: Goal = {
      id: 'low-hr-run',
      name: 'Improve low-HR running pace',
      type: 'floating-goal',
      discipline: 'running',
      status: 'draft',
      description: 'Improve pace at aerobic HR',
    }

    const result = evaluateGoalReadiness({
      goal,
      today: '2026-05-01',
      activities: [
        { id: 'run-1', source: 'manual', date: '2026-04-26', name: 'Low HR run', type: 'Run', durationSec: 45 * 60, load: 35, avgHr: 138 },
        { id: 'run-2', source: 'manual', date: '2026-04-29', name: 'Easy run', type: 'Run', durationSec: 35 * 60, load: 28, avgHr: 136 },
      ],
      races: [],
      state,
    })

    expect(result.dimensions.some((dimension) => dimension.label === 'pace at HR')).toBe(true)
    expect(result.confidence).toBe('medium')
    expect(result.commitmentAdvice).toContain('No race date required')
  })

  it('evaluates triathlon goals across swim bike run durability dimensions', () => {
    const goal: Goal = {
      id: 'im-lanzarote',
      name: 'Ironman Lanzarote',
      type: 'candidate-event',
      discipline: 'triathlon',
      status: 'candidate',
      targetDate: '2026-10-01',
    }

    const result = evaluateGoalReadiness({ goal, today: '2026-05-01', activities: bikeActivities, races: [], state })

    expect(result.dimensions.map((dimension) => dimension.label)).toEqual(expect.arrayContaining(['swim readiness', 'bike endurance', 'run durability', 'brick tolerance']))
    expect(result.mainLimiter.toLowerCase()).toContain('swim')
    expect(result.nextRecommendedPhase).toContain('base')
  })

  it('recalculates from actual activity instead of the planned trend', () => {
    const goal: Goal = {
      id: 'ld-tri',
      name: 'Build readiness for long-distance triathlon',
      type: 'floating-goal',
      discipline: 'triathlon',
      status: 'draft',
    }

    const skipped = evaluateGoalReadiness({ goal, today: '2026-05-01', activities: [], races: [], state })
    const actual = evaluateGoalReadiness({
      goal,
      today: '2026-05-01',
      activities: [
        ...bikeActivities,
        { id: 'run-1', source: 'manual', date: '2026-04-28', name: 'Easy run', type: 'Run', durationSec: 50 * 60, load: 42 },
        { id: 'brick-1', source: 'manual', date: '2026-04-30', name: 'Brick ride run', type: 'Run', durationSec: 25 * 60, load: 30 },
      ],
      races: [],
      state,
    })

    expect(actual.overallReadiness).toBeGreaterThan(skipped.overallReadiness)
    expect(actual.evidence).toContain('Actual activity history used as source of truth')
  })
})
