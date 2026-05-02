import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { buildPathToGoal } from './pathEngine'

const baseState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  recovery_score: 74,
  hrv_trend: 'stable',
}

const raceGoal: Goal = {
  id: 'im-lanzarote',
  name: 'Ironman Lanzarote',
  type: 'candidate-event',
  discipline: 'triathlon',
  status: 'candidate',
  targetDate: '2026-10-01',
}

const activities: Activity[] = [
  { id: 'ride-1', source: 'manual', date: '2026-04-27', name: 'Endurance ride', type: 'Ride', durationSec: 3 * 3600, load: 100 },
  { id: 'run-1', source: 'manual', date: '2026-04-29', name: 'Easy run', type: 'Run', durationSec: 45 * 60, load: 42 },
]

describe('pathEngine', () => {
  it('builds an adaptive path for a race goal without prescribing exact daily workouts', () => {
    const path = buildPathToGoal({ goal: raceGoal, today: '2026-05-01', readinessScore: 58, state: baseState, activities, races: [] })

    expect(path.goalName).toBe('Ironman Lanzarote')
    expect(path.phase).toBe('Build')
    expect(path.nextFocus).toContain('increase bike endurance')
    expect(path.suggestedStructure.some((item) => item.includes('Z2'))).toBe(true)
    expect(path.suggestedStructure.join(' ')).not.toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)
    expect(path.constraints).toContain('avoid stacking intensity')
    expect(path.overrideReason).toBeUndefined()
  })

  it('sets Foundation for draft endurance build goals with low readiness', () => {
    const goal: Goal = { id: 'ld', name: 'Build readiness for long-distance triathlon', type: 'floating-goal', discipline: 'triathlon', status: 'draft' }
    const path = buildPathToGoal({ goal, today: '2026-05-01', readinessScore: 34, state: baseState, activities: [], races: [] })

    expect(path.phase).toBe('Foundation')
    expect(path.nextFocus).toContain('establish repeatable aerobic frequency')
    expect(path.avoid).toContain('adding intensity to compensate for missing volume')
  })

  it('moves near fixed-date key events into Peak when readiness is sufficient', () => {
    const goal: Goal = { id: 'key-race', name: 'Key cycling event', type: 'key-performance-goal', discipline: 'cycling', status: 'key-event', targetDate: '2026-05-15' }
    const path = buildPathToGoal({ goal, today: '2026-05-01', readinessScore: 78, state: baseState, activities, races: [] })

    expect(path.phase).toBe('Peak')
    expect(path.constraints).toContain('protect freshness over extra fitness')
  })

  it('adapts after a recent race by protecting recovery', () => {
    const recentRace: Activity = { id: 'race-1', source: 'manual', date: '2026-04-30', name: 'Zwift Racing League', type: 'VirtualRide', durationSec: 3600, load: 88, raceCost: 82, raceCostBand: 'Extreme' }
    const path = buildPathToGoal({ goal: raceGoal, today: '2026-05-01', readinessScore: 62, state: baseState, activities: [recentRace, ...activities], races: [] })

    expect(path.phase).toBe('Recovery / Reset')
    expect(path.adaptationNotes.join(' ')).toContain('Recent high-cost race')
    expect(path.constraints).toContain('protect recovery after high race cost')
  })

  it('adapts after skipped sessions without criticism', () => {
    const path = buildPathToGoal({ goal: raceGoal, today: '2026-05-01', readinessScore: 50, state: baseState, activities: [], races: [] })

    expect(path.adaptationNotes.join(' ')).toContain('Low recent activity volume')
    expect(path.adaptationNotes.join(' ')).not.toMatch(/failed|ignored|non-compliant/i)
  })

  it('lets recovery override the path before goal readiness', () => {
    const path = buildPathToGoal({
      goal: raceGoal,
      today: '2026-05-01',
      readinessScore: 82,
      state: { ...baseState, recovery_status: 'red', recovery_score: 28 },
      activities,
      races: [],
    })

    expect(path.phase).toBe('Recovery / Reset')
    expect(path.overrideReason).toContain('Recovery overrides goal path')
    expect(path.avoid).toContain('forcing goal work while recovery is red')
  })

  it('respects mandatory races as constraints, not optional path inputs', () => {
    const mandatoryRace: Race = { id: 'ecro', name: 'ECRO Stage', date: '2026-05-03', discipline: 'cycling', priority: 'fixed', mandatory: true }
    const path = buildPathToGoal({ goal: raceGoal, today: '2026-05-01', readinessScore: 72, state: baseState, activities, races: [mandatoryRace] })

    expect(path.constraints).toContain('mandatory race calendar overrides optional goal work')
    expect(path.nextFocus).toContain('arrive fresh for fixed race execution')
  })
})
