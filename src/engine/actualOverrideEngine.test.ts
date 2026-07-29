import { describe, expect, it } from 'vitest'
import type { Activity, DecisionLogEntry, WorkoutRecommendation } from '../domain/types'
import { buildActualOverride } from './actualOverrideEngine'

const recommendation: WorkoutRecommendation = {
  primary: {
    discipline: 'bike',
    title: 'Bike recovery spin / optional opener',
    durationMin: 35,
    intensity: 'easy',
    hrCap: 145,
    powerCap: 210,
    purpose: 'Keep blood moving.',
    steps: [],
    cautions: [],
  },
  goalReminder: 'Protect race readiness.',
  longTermBias: 'Build durable aerobic base.',
}

const decision = (overrides: Partial<DecisionLogEntry>): DecisionLogEntry => ({
  id: 'decision-1',
  date: '2026-05-08',
  loggedAt: '2026-05-08T10:00:00.000Z',
  action: 'scenario-rest',
  mode: 'RecoveryOptimization',
  status: 'Red',
  workoutTitle: 'Rest',
  durationMin: 0,
  reason: 'Recovery debt',
  scenarioId: 'rest',
  scenarioLabel: 'Rest',
  ...overrides,
})

const activity = (overrides: Partial<Activity>): Activity => ({
  id: 'activity-1',
  source: 'intervals',
  date: '2026-05-08',
  name: 'Zwift - Endurance Ride',
  type: 'Ride',
  durationSec: 3600,
  load: 58,
  avgHr: 142,
  normalizedPower: 202,
  ...overrides,
})

describe('buildActualOverride', () => {
  it('waits for completed work when no actual exists today', () => {
    const override = buildActualOverride({ today: '2026-05-08', activities: [], decisionLog: [decision({})], recommendation })

    expect(override.status).toBe('waiting-for-actual')
    expect(override.authoritativeSource).toBe('logged-intent')
    expect(override.headline).toContain('No completed activity')
  })

  it('treats completed activity as authoritative over logged rest', () => {
    const override = buildActualOverride({ today: '2026-05-08', activities: [activity({ durationSec: 4200, load: 72 })], decisionLog: [decision({})], recommendation })

    expect(override.status).toBe('actual-overrides-log')
    expect(override.authoritativeSource).toBe('completed-activity')
    expect(override.actualSummary).toContain('70 min')
    expect(override.deltaSummary).toContain('Rest logged, but actual work exists')
    expect(override.tomorrowImpact).toContain('recalculate')
  })

  it('marks high intensity actuals as escalation even when easy was logged', () => {
    const override = buildActualOverride({
      today: '2026-05-08',
      activities: [activity({ name: 'ECRO Zwift Race', type: 'VirtualRide', load: 108, raceCost: 86 })],
      decisionLog: [decision({ action: 'scenario-easy', scenarioId: 'easy', workoutTitle: 'Easy aerobic', durationMin: 35 })],
      recommendation,
    })

    expect(override.status).toBe('actual-overrides-log')
    expect(override.severity).toBe('red')
    expect(override.deltaSummary).toContain('harder than logged')
  })
})
