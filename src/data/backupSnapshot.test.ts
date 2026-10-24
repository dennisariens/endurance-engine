import { describe, expect, it } from 'vitest'
import { validateBackupSnapshot, validateStateSnapshot } from './backupSnapshot'

// Synthetic fixtures only; no storage, credentials, or athlete data.
export const syntheticBackup = () => ({
  version: 2, exportedAt: '2026-10-01T12:00:00.000Z',
  races: [{ id: 'r1', date: '2026-10-02', name: 'Synthetic race', discipline: 'cycling', priority: 'fixed', mandatory: true }],
  goals: [{ id: 'g1', name: 'Synthetic goal', type: 'floating-goal', discipline: 'cycling', status: 'draft' }],
  activeGoalId: 'g1',
  activities: [{ id: 'a1', source: 'manual', date: '2026-10-01', name: 'Synthetic ride', type: 'Ride', load: 0 }],
  blockedDates: [{ id: 'b1', startDate: '2026-10-03', endDate: '2026-10-04', reason: 'travel', blocksRace: true }],
  decisionLog: [{ id: 'd1', date: '2026-10-01', loggedAt: '2026-10-01T12:00:00Z', action: 'rested', mode: 'Build', status: 'Green', workoutTitle: 'Rest', durationMin: 0, reason: 'Synthetic' }],
  currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 0,
    field_evidence: { recovery_score: { observedAt: '2026-10-01T12:00:00Z', source: 'garmin', quality: 'reported' } } },
  theme: 'dark',
})

describe('strict backup validation', () => {
  it.each([1, 2])('accepts schema %s, preserves zeros/evidence, and defaults optional conversation without mutation', version => {
    const input = { ...syntheticBackup(), version }
    const result = validateBackupSnapshot(input)
    expect(result).toMatchObject(input)
    expect(result.goalConversation).toEqual([])
    expect(input).not.toHaveProperty('goalConversation')
    expect(result.currentState.recovery_score).toBe(0)
  })

  it.each([
    ['version', 3], ['version', '2'], ['exportedAt', 'yesterday'],
    ['races', [{}]], ['goals', [{}]], ['activities', [{}]], ['blockedDates', [{}]], ['decisionLog', [{}]],
    ['currentState', {}], ['currentState', null], ['theme', 'neon'],
    ['account', null], ['account', { status: 'admin', displayName: 'QA', localOnly: true }],
    ['visualization', { performanceFocus: 'all', visibleFields: { load: [0] } }],
    ['activeGoalId', 'missing'], ['activeGoalId', null], ['goalConversation', null],
    ['goalConversation', [{ id: 'c1', goalId: 'missing', createdAt: '2026-10-01', kind: 'note', text: 'QA' }]],
  ])('rejects malformed %s before restore', (key, value) => {
    expect(() => validateBackupSnapshot({ ...syntheticBackup(), [key]: value })).toThrow('Invalid AERION backup file')
  })

  it.each(['races', 'goals', 'activities', 'blockedDates', 'decisionLog', 'currentState', 'theme'])('requires %s', key => {
    const input: Record<string, unknown> = syntheticBackup()
    delete input[key]
    expect(() => validateBackupSnapshot(input)).toThrow()
  })

  it.each([
    { source: 'fake' }, { load: -1 }, { load: NaN }, { durationSec: Infinity }, { distanceM: '0' }, { date: '2026-02-30' }, { raceCostBand: 'medium' },
  ])('rejects invalid activity fields %j', fields => {
    const input = syntheticBackup()
    expect(() => validateBackupSnapshot({ ...input, activities: [{ ...input.activities[0], ...fields }] })).toThrow()
  })

  it.each(['races', 'goals', 'activities', 'blockedDates', 'decisionLog'] as const)('rejects duplicate IDs in %s', key => {
    const input = syntheticBackup()
    expect(() => validateBackupSnapshot({ ...input, [key]: [input[key][0], input[key][0]] })).toThrow()
  })

  it.each([
    { recovery_status: 'blue' }, { injury_present: 0 }, { recovery_score: -1 }, { recovery_score: Infinity },
    { field_evidence: { recovery_score: { source: 'garmin', quality: 'reported', observedAt: 'invalid' } } },
    { field_evidence: { recovery_score: { source: 'fake', quality: 'reported', observedAt: '2026-10-01' } } },
    { field_evidence: { recovery_score: { source: 'garmin', quality: 'fake', observedAt: '2026-10-01' } } },
  ])('rejects malformed state and provenance %j', fields => {
    const input = syntheticBackup()
    expect(() => validateBackupSnapshot({ ...input, currentState: { ...input.currentState, ...fields } })).toThrow()
  })

  it('preserves legacy unknown observation time and all supported field provenance', () => {
    const input = syntheticBackup()
    const field_evidence = {
      recovery_score: { source: 'legacy-local', quality: 'legacy' },
      hrv_14d_avg: { source: 'apple-health', quality: 'reported', observedAt: '2026-10-01T00:00:00Z' },
      sleep_hours_14d_avg: { source: 'google-fit', quality: 'derived', observedAt: '2026-10-01' },
    }
    expect(validateBackupSnapshot({ ...input, currentState: { ...input.currentState, field_evidence } }).currentState.field_evidence).toEqual(field_evidence)
  })

  it('rejects evidence for unknown state fields', () => {
    const input = syntheticBackup()
    expect(() => validateBackupSnapshot({ ...input, currentState: { ...input.currentState, field_evidence: { fake: { source: 'garmin', quality: 'reported' } } } })).toThrow()
  })

  it('rejects partial backup envelopes at the direct boundary', () => {
    const { exportedAt: _exportedAt, ...input } = syntheticBackup()
    expect(() => validateStateSnapshot(input)).toThrow()
  })

  it.each([
    ['races', { discipline: 'swim' }], ['races', { mandatory: 'yes' }], ['races', { distanceKm: -1 }],
    ['goals', { status: 'done' }], ['goals', { type: 'fake' }], ['goals', { primaryMission: 0 }],
    ['blockedDates', { reason: 'fake' }], ['blockedDates', { endDate: '2026-01-01' }],
    ['decisionLog', { mode: 'fake' }], ['decisionLog', { durationMin: -1 }],
    ['decisionLog', { scenarioExpectedCostRange: { low: 4, high: 2 } }],
  ] as const)('validates all record fields in %s: %j', (key, fields) => {
    const input = syntheticBackup()
    expect(() => validateBackupSnapshot({ ...input, [key]: [{ ...input[key][0], ...fields }] })).toThrow()
  })

  it('accepts optional preferences and conversations without changing them', () => {
    const input = { ...syntheticBackup(),
      account: { status: 'local', displayName: 'Synthetic QA', localOnly: true },
      visualization: { performanceFocus: 'all', visibleFields: { load: ['ctl'], recovery: [] } },
      goalConversation: [{ id: 'c1', goalId: 'g1', createdAt: '2026-10-01T12:00:00Z', kind: 'note', text: 'Synthetic QA' }],
    }
    expect(validateBackupSnapshot(input)).toEqual(input)
  })

  it('validates the direct state boundary with or without backup envelope', () => {
    const { version: _version, exportedAt: _exportedAt, ...state } = syntheticBackup()
    expect(validateStateSnapshot(state).activities).toEqual(state.activities)
    expect(() => validateStateSnapshot({ ...state, theme: 'invalid' })).toThrow()
    expect(() => validateStateSnapshot({ ...state, version: 999 })).toThrow()
  })
})
