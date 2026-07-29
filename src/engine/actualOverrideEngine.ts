import type { Activity, DecisionLogEntry, WorkoutRecommendation } from '../domain/types'
import { isRaceLikeActivity } from './timelineEngine'

export type ActualOverrideStatus = 'waiting-for-actual' | 'actual-matches-log' | 'actual-overrides-log' | 'actual-without-log'
export type ActualOverrideSeverity = 'green' | 'yellow' | 'red' | 'slate'

export type ActualOverride = {
  status: ActualOverrideStatus
  authoritativeSource: 'completed-activity' | 'logged-intent' | 'planned-recommendation'
  severity: ActualOverrideSeverity
  headline: string
  plannedSummary: string
  loggedSummary: string
  actualSummary: string
  deltaSummary: string
  tomorrowImpact: string
}

type Input = {
  today: string
  activities: Activity[]
  decisionLog: DecisionLogEntry[]
  recommendation: WorkoutRecommendation
}

function minutes(seconds?: number): number | undefined {
  if (!seconds) return undefined
  return Math.round(seconds / 60)
}

function formatMinutes(value?: number): string {
  if (value == null) return 'duration n/a'
  return `${value} min`
}

function latestTodayActivity(activities: Activity[], today: string): Activity | undefined {
  return activities
    .filter((activity) => activity.date === today)
    .sort((a, b) => (b.load ?? 0) - (a.load ?? 0))[0]
}

function todaysDecision(decisions: DecisionLogEntry[], today: string): DecisionLogEntry | undefined {
  return decisions.find((decision) => decision.date === today)
}

function plannedSummary(recommendation: WorkoutRecommendation): string {
  const primary = recommendation.primary
  return `${primary.title} · ${formatMinutes(primary.durationMin)}${primary.hrCap ? ` · HR ≤ ${primary.hrCap}` : ''}${primary.powerCap ? ` · Power ≤ ${primary.powerCap}` : ''}`
}

function loggedSummary(decision?: DecisionLogEntry): string {
  if (!decision) return 'No logged intent yet'
  return `${decision.workoutTitle} · ${formatMinutes(decision.durationMin)} · ${decision.action}`
}

function actualSummary(activity?: Activity): string {
  if (!activity) return 'No completed activity synced for today'
  const parts = [activity.name, formatMinutes(minutes(activity.durationSec)), `load ${activity.load ?? 'n/a'}`]
  if (activity.avgHr) parts.push(`avg HR ${activity.avgHr}`)
  if (activity.normalizedPower) parts.push(`NP ${activity.normalizedPower}W`)
  if (activity.raceCost) parts.push(`race cost ${activity.raceCost}`)
  return parts.join(' · ')
}

function expectedLoggedLoad(decision?: DecisionLogEntry): number {
  if (!decision) return 0
  if (decision.action === 'rested' || decision.scenarioId === 'rest') return 0
  if (decision.scenarioId === 'easy') return 35
  if (decision.scenarioId === 'race') return 80
  if (decision.scenarioId === 'ignore' || decision.action === 'overridden') return 90
  return Math.max(10, decision.durationMin)
}

function actualLoad(activity?: Activity): number {
  if (!activity) return 0
  if (typeof activity.raceCost === 'number') return activity.raceCost
  if (isRaceLikeActivity(activity)) return Math.max(activity.load ?? 75, 80)
  return activity.load ?? Math.min(100, Math.round((minutes(activity.durationSec) ?? 0) * 0.8))
}

function severityFromDelta(delta: number, activity?: Activity): ActualOverrideSeverity {
  if (!activity) return 'slate'
  if (isRaceLikeActivity(activity) || delta >= 35 || actualLoad(activity) >= 80) return 'red'
  if (delta >= 15 || actualLoad(activity) >= 50) return 'yellow'
  return 'green'
}

function deltaSummary(activity: Activity | undefined, decision: DecisionLogEntry | undefined): string {
  if (!activity && decision) return 'Logged intent exists; completed activity has not synced yet.'
  if (!activity) return 'Plan exists; no logged intent or completed activity has synced yet.'
  if (!decision) return 'Completed activity exists without a logged scenario. Actual work becomes canonical.'

  const delta = actualLoad(activity) - expectedLoggedLoad(decision)
  if ((decision.action === 'rested' || decision.scenarioId === 'rest') && actualLoad(activity) > 0) return 'Rest logged, but actual work exists. Completed work overrides intent.'
  if (delta >= 20) return 'Completed activity was harder than logged. AERION overrides the click with actual load.'
  if (delta <= -20) return 'Completed activity was easier than logged. Recovery budget improves versus intent.'
  return 'Completed activity broadly matches logged intent.'
}

function status(activity: Activity | undefined, decision: DecisionLogEntry | undefined): ActualOverrideStatus {
  if (!activity) return 'waiting-for-actual'
  if (!decision) return 'actual-without-log'
  const delta = Math.abs(actualLoad(activity) - expectedLoggedLoad(decision))
  if ((decision.action === 'rested' || decision.scenarioId === 'rest') && actualLoad(activity) > 0) return 'actual-overrides-log'
  return delta >= 20 ? 'actual-overrides-log' : 'actual-matches-log'
}

export function buildActualOverride({ today, activities, decisionLog, recommendation }: Input): ActualOverride {
  const activity = latestTodayActivity(activities, today)
  const decision = todaysDecision(decisionLog, today)
  const currentStatus = status(activity, decision)
  const delta = actualLoad(activity) - expectedLoggedLoad(decision)
  const severity = severityFromDelta(delta, activity)

  return {
    status: currentStatus,
    authoritativeSource: activity ? 'completed-activity' : decision ? 'logged-intent' : 'planned-recommendation',
    severity,
    headline: activity
      ? currentStatus === 'actual-matches-log'
        ? 'Completed activity confirms the logged intent.'
        : 'Completed activity overrides the plan/log.'
      : 'No completed activity synced for today yet.',
    plannedSummary: plannedSummary(recommendation),
    loggedSummary: loggedSummary(decision),
    actualSummary: actualSummary(activity),
    deltaSummary: deltaSummary(activity, decision),
    tomorrowImpact: activity
      ? 'Tomorrow should recalculate from completed load, duration, HR/power, race-like classification, and morning readiness.'
      : 'Tomorrow remains provisional until synced activity or rest confirmation arrives.',
  }
}
