import type { Activity, CurrentState, Goal } from '../domain/types'
import { daysOld } from './freshness'
import { fieldEvidence, observationTime, readinessObservedAt, stateFieldEntries } from './recoveryEvidence'

const recoveryFields = ['recovery_score', 'garmin_training_readiness', 'resting_hr_14d_avg', 'hrv_14d_avg', 'hrv_trend', 'sleep_hours_14d_avg', 'sleep_score', 'garmin_body_battery', 'garmin_stress_avg', 'garmin_sleep_score', 'garmin_hrv_status', 'recovery_time_hours']
const legacyRecoveryConflicts = new Set([
  'Older or undated recovery sync was ignored; browser-local evidence was preserved.',
  'Same-date recovery sources disagree; browser-local evidence was preserved for review.',
])

export function buildCoachingProvenance(input: { today: string; state: CurrentState; activities: Activity[]; goals: Goal[]; activeGoalId?: string }) {
  const issues: string[] = []
  const updatedAt = readinessObservedAt(input.state)
  const age = daysOld(input.today, updatedAt)
  const fields = Object.fromEntries(stateFieldEntries(input.state).map(([field]) => {
    const evidence = fieldEvidence(input.state, field)
    const ageDays = daysOld(input.today, evidence.observedAt)
    const status = ageDays == null ? 'missing' : ageDays >= 2 ? 'stale' : 'current'
    return [field, { ...evidence, ageDays, status }]
  }))
  const hasReadiness = input.state.recovery_score != null || input.state.garmin_training_readiness != null
  const missing = age == null || !hasReadiness
  const stale = (age != null && age >= 2) || recoveryFields.some(field => fields[field]?.status === 'stale')
  const invalidFields = stateFieldEntries(input.state).filter(([field, value]) => {
    const date = fieldEvidence(input.state, field).observedAt
    return (typeof value === 'number' && !Number.isFinite(value)) || Boolean(date && (observationTime(date) === undefined || date.slice(0, 10) > input.today))
  })
  const conflicts = new Set(input.activities.map(a => a.id)).size !== input.activities.length
    || Boolean(input.state.data_conflicts?.length)
    || Boolean(input.activeGoalId && !input.goals.some(g => g.id === input.activeGoalId))
    || Boolean(input.state.last_updated && input.state.last_updated.slice(0, 10) > input.today)
    || Boolean(input.state.last_updated && observationTime(input.state.last_updated) === undefined)
    || invalidFields.length > 0
  if (missing) issues.push('Recovery measurement or its date is missing.')
  if (stale) issues.push('Recovery evidence is at least two days old.')
  if (conflicts) issues.push('Conflicting activity IDs, selected goal, or future-dated recovery evidence; review imported data.')
  issues.push(...input.state.data_conflicts ?? [])
  return { origin: 'browser-local' as const, status: conflicts ? 'conflicting' as const : missing ? 'missing' as const : stale ? 'stale' as const : 'current' as const, updatedAt, fields, issues }
}

/** Newer local recovery must not be overwritten by stale or undated sync. */
export function mergeRecoveryEvidence(current: CurrentState, incoming: Partial<CurrentState>): CurrentState {
  if (!Object.keys(incoming).length) return current
  const merged = { ...current, field_evidence: { ...current.field_evidence } }
  for (const [field] of stateFieldEntries(current)) merged.field_evidence[field] = fieldEvidence(current, field)
  // Legacy warnings did not identify affected fields. Conservatively scope only
  // the two known messages to ALL existing measured recovery fields, before any
  // imports add fields. The normal strictly-newer resolver below can then clear
  // each field independently; untouched fields and arbitrary flags survive.
  // If no fields can be identified, retain the original warning for review.
  const existingRecoveryFields = stateFieldEntries(current).filter(([field]) => recoveryFields.includes(field))
  let conflicts = (current.data_conflicts ?? []).flatMap(message =>
    legacyRecoveryConflicts.has(message) && existingRecoveryFields.length
      ? existingRecoveryFields.map(([field]) => `Recovery field ${field}: ${message}`)
      : [message])
  for (const [field, value] of stateFieldEntries(incoming)) {
    const evidence = fieldEvidence(incoming, field)
    const nextTime = observationTime(evidence.observedAt)
    const oldTime = observationTime(fieldEvidence(current, field).observedAt)
    const differs = current[field] != null && current[field] !== value
    if ((typeof value === 'number' && !Number.isFinite(value)) || (evidence.observedAt && nextTime === undefined)
      || (differs && (nextTime === undefined || (oldTime !== undefined && nextTime <= oldTime)))) {
      const message = `Recovery field ${field}: older, undated or same-date conflicting import ignored; browser-local evidence preserved.`
      if (!conflicts.includes(message)) conflicts.push(message)
      continue
    }
    // Identical stale values do not refresh their observation metadata.
    if (!differs && current[field] != null && (nextTime === undefined || (oldTime !== undefined && nextTime < oldTime))) continue
    Object.assign(merged, { [field]: value })
    merged.field_evidence[field] = evidence
    if (nextTime !== undefined && (oldTime === undefined || nextTime > oldTime)) conflicts = conflicts.filter(message => !message.startsWith(`Recovery field ${field}:`))
  }
  const dates = Object.values(merged.field_evidence).map(evidence => evidence?.observedAt).filter((date): date is string => observationTime(date) !== undefined)
  // Compatibility for score-date consumers: unrelated imports must not make an
  // old (or explicitly undated) score look fresh. Per-field dates stay authoritative.
  merged.last_updated = merged.recovery_score != null
    ? fieldEvidence(merged, 'recovery_score').observedAt
    : merged.garmin_training_readiness != null
      ? fieldEvidence(merged, 'garmin_training_readiness').observedAt
      : dates.sort((a, b) => observationTime(b)! - observationTime(a)!)[0]
  merged.data_conflicts = conflicts
  return merged
}
