import type { CurrentState, CurrentStateField, StateFieldEvidence } from '../domain/types'

/** Strict calendar validation; Date.parse alone silently rolls February 30 forward. */
export function observationTime(value?: string | null): number | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return undefined
  const day = value.slice(0, 10)
  const midnight = Date.parse(`${day}T00:00:00Z`)
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== day) return undefined
  const time = Date.parse(value.length === 10 ? `${day}T00:00:00Z` : value)
  return Number.isFinite(time) ? time : undefined
}

export function stateFieldEntries(state: Partial<CurrentState>): [CurrentStateField, unknown][] {
  const fields: CurrentStateField[] = ['injury_present', 'illness_present', 'recovery_status', 'race_today', 'race_tomorrow', 'latest_race_cost', 'latest_race_cost_band', 'run_max_hr_6m', 'cycle_max_hr_6m', 'eftp_watts', 'resting_hr_14d_avg', 'hrv_14d_avg', 'sleep_hours_14d_avg', 'vo2max', 'hrv_trend', 'sleep_score', 'recovery_score', 'body_weight_kg', 'garmin_body_battery', 'garmin_stress_avg', 'garmin_training_readiness', 'garmin_sleep_score', 'garmin_hrv_status', 'steps_7d_avg', 'recovery_time_hours', 'training_status', 'run_lthr', 'cycle_lthr', 'run_aet', 'cycle_aet']
  return fields.filter(field => state[field] != null).map(field => [field, state[field]])
}

export function fieldEvidence(state: Partial<CurrentState>, field: CurrentStateField): StateFieldEvidence {
  // Once a field is stamped, never relabel it using a later aggregate date.
  return state.field_evidence?.[field] ?? { observedAt: state.last_updated, source: 'legacy-local', quality: 'legacy' }
}

export function stampStateFields(state: Partial<CurrentState>, source: StateFieldEvidence['source']): Partial<CurrentState> {
  return {
    ...state,
    field_evidence: Object.fromEntries(stateFieldEntries(state).map(([field]) => [field, { observedAt: state.last_updated, source, quality: 'reported' }])),
  }
}

export const readinessFields = ['recovery_score', 'garmin_training_readiness'] as const

export function readinessObservedAt(state: CurrentState): string | undefined {
  const fields = readinessFields.filter(field => state[field] != null)
  if (!fields.length) return undefined
  const dates = fields.map(field => fieldEvidence(state, field).observedAt)
  if (dates.some(date => observationTime(date) === undefined)) return undefined
  return dates.sort((a, b) => observationTime(a)! - observationTime(b)!)[0]
}
