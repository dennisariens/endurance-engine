import { describe, expect, it } from 'vitest'
import type { CurrentState } from '../domain/types'
import { buildCoachingProvenance, mergeRecoveryEvidence } from './coachingProvenance'
import { normalizeGarminRecoveryState } from './integrations/garminRecoveryAdapter'
import { normalizeIntervalsWellness } from './integrations/intervalsAdapter'
import { buildFreshnessReport } from './freshness'
import { buildEvidenceRecords } from './evidence'

const base: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'unknown' }
const context = { today: '2026-10-17', activities: [], goals: [] }

describe('field-level recovery evidence', () => {
  it('does not refresh an old readiness measurement when a newer unrelated field arrives', () => {
    const current = { ...base, recovery_score: 80, last_updated: '2026-10-10' }
    const merged = mergeRecoveryEvidence(current, normalizeIntervalsWellness([{ id: '2026-10-17', restingHR: 50 }]))
    expect(merged.last_updated).toBe('2026-10-10')
    expect(merged.field_evidence?.recovery_score?.observedAt).toBe('2026-10-10')
    expect(merged.field_evidence?.resting_hr_14d_avg).toMatchObject({ observedAt: '2026-10-17', source: 'intervals' })
    expect(buildCoachingProvenance({ ...context, state: merged }).status).toBe('stale')
  })

  it('fills absent fields from older evidence without overwriting newer local values', () => {
    const current = { ...base, recovery_score: 0, last_updated: '2026-10-17' }
    const merged = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date: '2026-10-16', recoveryScore: 90, sleepHours: 8 }))
    expect(merged.recovery_score).toBe(0)
    expect(merged.sleep_hours_14d_avg).toBe(8)
    expect(merged.last_updated).toBe('2026-10-17')
    expect(merged.data_conflicts?.join(' ')).toContain('recovery_score')
  })

  it('preserves same-date conflicts across unrelated imports and resolves only the newer field', () => {
    const current = { ...base, recovery_score: 80, last_updated: '2026-10-15' }
    const conflict = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date: '2026-10-15', recoveryScore: 20 }))
    const unrelated = mergeRecoveryEvidence(conflict, normalizeIntervalsWellness([{ id: '2026-10-16', restingHR: 50 }]))
    expect(unrelated.data_conflicts?.join(' ')).toContain('recovery_score')
    const resolved = mergeRecoveryEvidence(unrelated, normalizeGarminRecoveryState({ date: '2026-10-17', recoveryScore: 0 }))
    expect(resolved.recovery_score).toBe(0)
    expect(resolved.data_conflicts).toEqual([])
  })

  describe.each([
    'Older or undated recovery sync was ignored; browser-local evidence was preserved.',
    'Same-date recovery sources disagree; browser-local evidence was preserved for review.',
  ])('legacy conflict migration: %s', legacyMessage => {
    const unrelated = 'Manual review flag: verify activity source.'
    const current = { ...base, recovery_score: 80, sleep_score: 70, last_updated: '2026-10-15', data_conflicts: [legacyMessage, unrelated] }

    it('resolves recognized legacy conflicts after all existing recovery fields receive strictly newer evidence', () => {
      const merged = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date: '2026-10-16', recoveryScore: 90, sleepScore: 75 }))
      expect(merged.data_conflicts).toEqual([unrelated])
    })

    it('retains unupdated fields and unrelated flags across partial imports', () => {
      const partial = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date: '2026-10-16', recoveryScore: 90 }))
      expect(partial.data_conflicts).not.toContain(legacyMessage)
      expect(partial.data_conflicts).toContain(unrelated)
      expect(partial.data_conflicts?.filter(message => message.startsWith('Recovery field '))).toEqual([
        expect.stringContaining('Recovery field sleep_score:'),
      ])
      const resolved = mergeRecoveryEvidence(partial, normalizeGarminRecoveryState({ date: '2026-10-17', sleepScore: 75 }))
      expect(resolved.data_conflicts).toEqual([unrelated])
    })

    it.each([undefined, '2026-10-14', '2026-10-15'])('does not resolve existing fields using unchanged values dated %s', date => {
      const merged = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date, recoveryScore: 80, sleepScore: 70 }))
      expect(merged.data_conflicts).toContain(unrelated)
      expect(merged.data_conflicts).toEqual(expect.arrayContaining([
        expect.stringContaining('Recovery field recovery_score:'),
        expect.stringContaining('Recovery field sleep_score:'),
      ]))
    })

    it('retains the legacy warning if there are no existing measured recovery fields to scope it to', () => {
      const merged = mergeRecoveryEvidence({ ...base, data_conflicts: [legacyMessage, unrelated] }, normalizeGarminRecoveryState({ date: '2026-10-17', recoveryScore: 90 }))
      expect(merged.data_conflicts).toEqual([legacyMessage, unrelated])
    })
  })

  it('preserves an explicitly undated score despite newer dated recovery fields', () => {
    const current: CurrentState = { ...base, recovery_score: 80, last_updated: '2026-10-15', field_evidence: { recovery_score: { source: 'manual', quality: 'reported' } } }
    const merged = mergeRecoveryEvidence(current, normalizeIntervalsWellness([{ id: '2026-10-17', restingHR: 50 }]))
    expect(merged.last_updated).toBeUndefined()
    expect(merged.field_evidence?.recovery_score?.observedAt).toBeUndefined()
    expect(merged.field_evidence?.resting_hr_14d_avg?.observedAt).toBe('2026-10-17')
  })

  it('uses training readiness date when there is no recovery score', () => {
    const merged = mergeRecoveryEvidence({ ...base, garmin_training_readiness: 0, last_updated: '2026-10-15' }, normalizeIntervalsWellness([{ id: '2026-10-17', restingHR: 50 }]))
    expect(merged.last_updated).toBe('2026-10-15')
    expect(merged.field_evidence?.resting_hr_14d_avg?.observedAt).toBe('2026-10-17')
  })

  it('uses the latest field date when neither readiness measurement exists', () => {
    const merged = mergeRecoveryEvidence({ ...base, sleep_score: 70, last_updated: '2026-10-15' }, normalizeIntervalsWellness([{ id: '2026-10-17', restingHR: 50 }]))
    expect(merged.last_updated).toBe('2026-10-17')
    expect(merged.field_evidence?.sleep_score?.observedAt).toBe('2026-10-15')
  })

  it('does not invent observation dates for undated inputs or accept invalid dates', () => {
    const merged = mergeRecoveryEvidence(base, normalizeGarminRecoveryState({ recoveryScore: 60 }))
    expect(merged.last_updated).toBeUndefined()
    expect(buildCoachingProvenance({ ...context, state: merged }).status).toBe('missing')
    expect(buildCoachingProvenance({ ...context, state: { ...base, recovery_score: 60, last_updated: '2026-02-30' } }).status).toBe('conflicting')
  })

  it('retains the observation date of each Intervals field across sparse daily rows', () => {
    const normalized = normalizeIntervalsWellness([
      { id: '2026-10-17', restingHR: 50 },
      { id: '2026-10-16', trainingReadiness: 0, sleepSecs: 0 },
    ])
    expect(normalized.garmin_training_readiness).toBe(0)
    expect(normalized.field_evidence?.garmin_training_readiness).toMatchObject({ observedAt: '2026-10-16', source: 'intervals' })
    expect(normalized.field_evidence?.resting_hr_14d_avg?.observedAt).toBe('2026-10-17')
  })

  it('reports the oldest readiness input instead of hiding it behind a newer score', () => {
    const merged = mergeRecoveryEvidence({ ...base, recovery_score: 70, last_updated: '2026-10-10' }, normalizeGarminRecoveryState({ date: '2026-10-17', trainingReadiness: 80 }))
    expect(buildCoachingProvenance({ ...context, state: merged }).status).toBe('stale')
  })

  it('exposes stale field quality independently of a current readiness score', () => {
    const merged = mergeRecoveryEvidence({ ...base, hrv_14d_avg: 50, last_updated: '2026-10-01' }, normalizeGarminRecoveryState({ date: '2026-10-17', trainingReadiness: 80 }))
    const provenance = buildCoachingProvenance({ ...context, state: merged })
    expect(provenance.fields.hrv_14d_avg).toMatchObject({ observedAt: '2026-10-01', status: 'stale', ageDays: 16 })
    expect(provenance.fields.garmin_training_readiness).toMatchObject({ observedAt: '2026-10-17', status: 'current', ageDays: 0 })
    expect(provenance.status).toBe('stale')
  })

  it('does not turn legacy fixture annotations into measured state fields', () => {
    const current = { ...base, source: 'legacy annotation', athlete_id: 'synthetic', last_updated: '2026-10-01' }
    const merged = mergeRecoveryEvidence(current, normalizeGarminRecoveryState({ date: '2026-10-17', trainingReadiness: 80 }))
    expect(Object.keys(merged.field_evidence ?? {})).not.toContain('source')
    expect(Object.keys(merged.field_evidence ?? {})).not.toContain('athlete_id')
  })

  it('uses readiness observation time in the shared freshness report', () => {
    const merged = mergeRecoveryEvidence({ ...base, recovery_score: 70, last_updated: '2026-10-01' }, normalizeGarminRecoveryState({ date: '2026-10-17', sleepScore: 80 }))
    const report = buildFreshnessReport({ today: context.today, state: merged, activities: [], races: [] })
    expect(report.signals.find(signal => signal.source === 'current-state')).toMatchObject({ date: '2026-10-01', status: 'stale' })
  })

  it('does not label every historical activity fresh because the newest activity is fresh', () => {
    const activities = [
      { id: 'old', source: 'manual' as const, date: '2026-01-01', name: 'Synthetic old activity', type: 'Run' },
      { id: 'new', source: 'manual' as const, date: context.today, name: 'Synthetic new activity', type: 'Run' },
    ]
    const freshness = buildFreshnessReport({ ...context, state: base, activities, races: [] })
    const evidence = buildEvidenceRecords({ athleteId: 'synthetic', generatedAt: '2026-10-17T10:00:00Z', state: base, activities, races: [], goals: [], freshness })
    expect(evidence.find(record => record.id === 'activity:manual:old')?.quality).toBe('stale')
    expect(evidence.find(record => record.id === 'activity:manual:new')?.freshnessHours).toBe(0)
  })
})
