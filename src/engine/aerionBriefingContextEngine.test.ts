import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState, Goal, Race } from '../domain/types'
import { buildAerionBriefingContext } from './aerionBriefingContextEngine'

const activities: Activity[] = [
  { id: 'ride-1', source: 'manual', date: '2026-06-08', name: 'Zwift race', type: 'Ride', durationSec: 4200, load: 95, raceCost: 78, raceCostBand: 'High' },
]

const races: Race[] = [
  { id: 'race-1', date: '2026-06-12', name: 'Friday Crit', discipline: 'cycling', priority: 'fixed', mandatory: true, distanceKm: 62 },
]

const goals: Goal[] = [
  { id: 'goal-1', name: 'Summer race block', type: 'fixed-date-race', discipline: 'cycling', status: 'committed', targetDate: '2026-07-01' },
]

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'yellow',
  latest_race_cost: 78,
  latest_race_cost_band: 'High',
  recovery_score: 47,
  garmin_body_battery: 38,
  garmin_training_readiness: 42,
  garmin_sleep_score: 76,
  garmin_stress_avg: 44,
}

describe('buildAerionBriefingContext', () => {
  it('emits a Hermes-ready AERION daily briefing payload', () => {
    const context = buildAerionBriefingContext({ date: '2026-06-09', activities, races, goals, state })

    expect(context.date).toBe('2026-06-09')
    expect(context.timezone).toBe('Europe/Amsterdam')
    expect(context.briefing.header).toContain('AERION DAILY')
    expect(context.briefing.telegramText).toContain('1. Recent activity')
    expect(context.briefing.telegramText).toContain('Reply: /accept')
    expect(context.coach.headline).toBeTruthy()
    expect(context.coach.dominantConstraint).toBeTruthy()
    expect(context.control.athleteState.stateVersion).toBe('canonical-athlete-state-v2-draft-1')
    expect(context.control.athleteState.recovery.status).toBe('yellow')
    expect(context.control.evidence.length).toBeGreaterThan(0)
    expect(context.control.freshness.overall).toBeTruthy()
    expect(context.control.next72Plan.blocks).toHaveLength(4)
    expect(context.control.trajectory.engineVersion).toBe('trajectory-engine-v1')
    expect(context.control.trajectory.scenarios.map((scenario) => scenario.id)).toEqual(['recommended', 'race', 'rest', 'ignore'])
    expect(context.control.learning.engineVersion).toBe('learning-engine-v1')
    expect(context.control.learning.notes).toContain('Actual completed work remains canonical evidence.')
    expect(context.control.stats.racesNext30d).toBe(1)
  })
})
