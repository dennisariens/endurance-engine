import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { buildMarathonBlock } from './marathonBlockEngine'

const state: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'green', recovery_score: 72 }
const marathonGoal: Goal = {
  id: 'amsterdam-sub3',
  name: 'Amsterdam Marathon sub-3',
  type: 'fixed-date-race',
  discipline: 'running',
  status: 'committed',
  targetDate: '2026-11-15',
}

const activities: Activity[] = [
  { id: 'easy-1', source: 'manual', date: '2026-08-18', name: 'Easy run heat reference', type: 'run', durationSec: 3_420, avgHr: 129, distanceM: 9_650 },
]

const races: Race[] = [
  { id: 'worlds-1', date: '2026-08-22', name: 'Zwift Worlds TTT', series: 'Worlds', discipline: 'cycling', priority: 'optional', mandatory: false },
  { id: 'run-1', date: '2026-09-06', name: 'Tune-up 10k', discipline: 'running', priority: 'fixed', mandatory: true },
]

describe('buildMarathonBlock', () => {
  it('builds an active marathon operating context from the running goal', () => {
    const result = buildMarathonBlock({ today: '2026-08-20', activeGoal: marathonGoal, goals: [marathonGoal], races, activities, state })

    expect(result.engineVersion).toBe('marathon-block-v1')
    expect(result.active).toBe(true)
    expect(result.mission).toContain('Amsterdam Marathon sub-3')
    expect(result.daysToRace).toBe(87)
    expect(result.phase).toBe('build')
    expect(result.priorityStack[0]).toContain('Marathon performance')
    expect(result.easyEfficiency.markerHrRange).toBe('129–132 bpm')
    expect(result.easyEfficiency.raceDayExpected).toContain('5:05')
  })

  it('prefers an explicit running primary mission over name heuristics', () => {
    const unnamedMission: Goal = { ...marathonGoal, id: 'sub3-explicit', name: 'Sub-3 on Nov 15', primaryMission: true }
    const heuristicGoal: Goal = { ...marathonGoal, id: 'old-marathon', name: 'Old Marathon idea', targetDate: '2026-12-01' }
    const result = buildMarathonBlock({ today: '2026-08-20', activeGoal: heuristicGoal, goals: [heuristicGoal, unnamedMission], races, activities, state })

    expect(result.mission).toContain('Sub-3 on Nov 15')
    expect(result.daysToRace).toBe(87)
  })

  it('moves long-run placement away from protected cycling weekends', () => {
    const result = buildMarathonBlock({ today: '2026-08-20', activeGoal: marathonGoal, goals: [marathonGoal], races, activities, state })

    expect(result.longRunPlacement.recommendation).toBe('weekday')
    expect(result.longRunPlacement.protectedWeekendEvents[0]).toContain('Zwift Worlds TTT')
    expect(result.cyclingPolicy).toContain('aerobic engine')
  })

  it('falls back to normal weekend long-run rhythm when no protected cycling block is loaded', () => {
    const result = buildMarathonBlock({ today: '2026-08-20', activeGoal: marathonGoal, goals: [marathonGoal], races: [], activities, state })

    expect(result.longRunPlacement.recommendation).toBe('weekend')
    expect(result.weekRules).toContain('Build repeatable run frequency before exotic workouts.')
  })

  it('keeps the fixed mission but records health override logic', () => {
    const result = buildMarathonBlock({ today: '2026-11-10', activeGoal: marathonGoal, goals: [marathonGoal], races: [], activities, state: { ...state, illness_present: true } })

    expect(result.phase).toBe('race-week')
    expect(result.decisionRules[0]).toContain('Injury/illness can override')
  })
})
