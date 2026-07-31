import { describe, expect, it } from 'vitest'
import type { Activity, DecisionLogEntry } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import { buildLearningEngine } from './learningEngine'

const activities: Activity[] = [
  { id: 'race-1', source: 'intervals', date: '2026-07-28', name: 'Hard race', type: 'Ride', durationSec: 3600, load: 95 },
  { id: 'easy-1', source: 'manual', date: '2026-07-29', name: 'Easy spin', type: 'Ride', durationSec: 1800, load: 25 },
]

const decisions: DecisionLogEntry[] = [
  { id: 'd1', date: '2026-07-28', loggedAt: '2026-07-28T06:00:00.000Z', action: 'rested', mode: 'Build', status: 'Yellow', workoutTitle: 'Rest', durationMin: 0, reason: 'Planned rest' },
  { id: 'd2', date: '2026-07-29', loggedAt: '2026-07-29T06:00:00.000Z', action: 'accepted', mode: 'Build', status: 'Green', workoutTitle: 'Easy spin', durationMin: 30, reason: 'Easy work' },
]

const athleteState = {
  behaviour: { completionRate: 0.55, confidence: 0.45 },
  recovery: { status: 'green' },
  evidenceSummary: { includedEvidenceIds: ['activity:intervals:race-1', 'state:current:2026-07-31'] },
} as unknown as CanonicalAthleteState

describe('buildLearningEngine', () => {
  it('detects rest-day overreach from actual completed work', () => {
    const learning = buildLearningEngine({ today: '2026-07-31', activities, decisions, athleteState })

    expect(learning.engineVersion).toBe('learning-engine-v1')
    expect(learning.sampleSize.activities).toBe(2)
    expect(learning.signals.some((signal) => signal.id === 'behaviour:overreach-rest-days')).toBe(true)
    expect(learning.notes).toContain('Actual completed work remains canonical evidence.')
  })

  it('returns a watch signal when pattern density is low', () => {
    const learning = buildLearningEngine({ today: '2026-07-31', activities: [], decisions: [], athleteState })

    expect(learning.signals[0]).toMatchObject({ id: 'learning:insufficient-pattern-density', direction: 'watch' })
    expect(learning.recommendedPolicyAdjustments[0]).toContain('collect more actual-completed evidence')
  })
})
