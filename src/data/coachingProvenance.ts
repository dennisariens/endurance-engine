import type { Activity, CurrentState, Goal } from '../domain/types'
import { daysOld } from './freshness'

export function buildCoachingProvenance(input: { today: string; state: CurrentState; activities: Activity[]; goals: Goal[]; activeGoalId?: string }) {
  const issues: string[] = []
  const age = daysOld(input.today, input.state.last_updated)
  const hasReadiness = input.state.recovery_score != null || input.state.garmin_training_readiness != null
  const missing = age == null || !hasReadiness
  const stale = age != null && age >= 2
  const conflicts = new Set(input.activities.map(a => a.id)).size !== input.activities.length
    || Boolean(input.state.data_conflicts?.length)
    || Boolean(input.activeGoalId && !input.goals.some(g => g.id === input.activeGoalId))
    || Boolean(input.state.last_updated && input.state.last_updated.slice(0, 10) > input.today)
  if (missing) issues.push('Recovery measurement or its date is missing.')
  if (stale) issues.push('Recovery evidence is at least two days old.')
  if (conflicts) issues.push('Conflicting activity IDs, selected goal, or future-dated recovery evidence; review imported data.')
  issues.push(...input.state.data_conflicts ?? [])
  return { origin: 'browser-local' as const, status: conflicts ? 'conflicting' as const : missing ? 'missing' as const : stale ? 'stale' as const : 'current' as const, updatedAt: input.state.last_updated, issues }
}

/** Newer local recovery must not be overwritten by stale or undated sync. */
export function mergeRecoveryEvidence(current: CurrentState, incoming: Partial<CurrentState>): CurrentState {
  if (!Object.keys(incoming).length) return current
  if (current.last_updated && (!incoming.last_updated || incoming.last_updated < current.last_updated)) {
    return { ...current, data_conflicts: ['Older or undated recovery sync was ignored; browser-local evidence was preserved.'] }
  }
  const differing = Object.entries(incoming).some(([key, value]) => value != null && key !== 'last_updated' && current[key as keyof CurrentState] != null && current[key as keyof CurrentState] !== value)
  if (current.last_updated && incoming.last_updated === current.last_updated && differing) {
    return { ...current, data_conflicts: ['Same-date recovery sources disagree; browser-local evidence was preserved for review.'] }
  }
  return { ...current, ...Object.fromEntries(Object.entries(incoming).filter(([, value]) => value != null)), data_conflicts: [] }
}
