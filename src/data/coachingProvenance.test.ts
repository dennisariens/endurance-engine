import { describe, expect, it } from 'vitest'
import { buildCoachingProvenance, mergeRecoveryEvidence } from './coachingProvenance'
import type { Activity, CurrentState } from '../domain/types'

const state: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'unknown' }
const input = { today: '2026-10-16', state, activities: [], goals: [] }
describe('browser coaching provenance', () => {
  it('reports missing measurements', () => expect(buildCoachingProvenance(input).status).toBe('missing'))
  it('preserves an actual zero as a present measurement', () => expect(buildCoachingProvenance({ ...input, state: { ...state, recovery_score: 0, last_updated: '2026-10-16' } }).status).toBe('current'))
  it('reports stale measurements', () => expect(buildCoachingProvenance({ ...input, state: { ...state, recovery_score: 70, last_updated: '2026-10-10' } }).status).toBe('stale'))
  it('reports a selected goal conflict', () => expect(buildCoachingProvenance({ ...input, activeGoalId: 'missing' }).status).toBe('conflicting'))
  it('reports duplicate activity IDs', () => expect(buildCoachingProvenance({ ...input, activities: [{ id: 'duplicate' }, { id: 'duplicate' }] as Activity[] }).status).toBe('conflicting'))
  it('preserves newer local evidence instead of accepting stale sync', () => {
    const merged = mergeRecoveryEvidence({ ...state, recovery_score: 0, last_updated: '2026-10-16' }, { recovery_score: 90, last_updated: '2026-10-15' })
    expect(merged.recovery_score).toBe(0)
    expect(buildCoachingProvenance({ ...input, state: merged }).status).toBe('conflicting')
  })
  it('flags conflicting same-date readings and accepts newer zeros', () => {
    const local = { ...state, recovery_score: 80, last_updated: '2026-10-15' }
    expect(mergeRecoveryEvidence(local, { recovery_score: 20, last_updated: '2026-10-15' }).recovery_score).toBe(80)
    expect(mergeRecoveryEvidence(local, { recovery_score: 0, last_updated: '2026-10-16' }).recovery_score).toBe(0)
  })
})
