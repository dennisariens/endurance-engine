import type { Activity, ActivitySource, CurrentState } from '../domain/types'
import type { FreshnessReport } from './freshness'
import type { SyncStatus } from '../lib/dataSync'

export type IntegrationId = 'intervals' | 'garmin' | 'strava' | 'manual'
export type IntegrationState = 'connected' | 'syncing' | 'not-connected' | 'offline' | 'error' | 'local'
export type IntegrationPriority = 'training-load' | 'recovery-truth' | 'activity-proof' | 'override'

export type IntegrationHealth = {
  id: IntegrationId
  name: string
  state: IntegrationState
  priority: IntegrationPriority
  lastSyncedAt?: string
  recordCount?: number
  detail: string
  nextAction: string
}

function countSource(activities: Activity[], source: ActivitySource): number {
  return activities.filter((activity) => activity.source === source).length
}

function freshnessDetail(freshness: FreshnessReport | undefined, source: FreshnessReport['signals'][number]['source']): string | undefined {
  const signal = freshness?.signals.find((item) => item.source === source)
  if (!signal || signal.status === 'fresh') return undefined
  return signal.message
}

export function buildIntegrationHealth(input: { activities: Activity[]; state: CurrentState; syncStatus: SyncStatus; freshness?: FreshnessReport }): IntegrationHealth[] {
  const { activities, state, syncStatus, freshness } = input
  const intervalCount = countSource(activities, 'intervals')
  const garminSignals = [
    state.garmin_body_battery,
    state.garmin_training_readiness,
    state.garmin_sleep_score,
    state.garmin_stress_avg,
    state.garmin_hrv_status,
  ].filter((value) => value != null).length
  const stravaCount = countSource(activities, 'strava')
  const manualCount = countSource(activities, 'manual')

  const intervalsState: IntegrationState = syncStatus.state === 'fresh'
    ? 'connected'
    : syncStatus.state === 'syncing'
      ? 'syncing'
      : syncStatus.state === 'error'
        ? 'error'
        : 'offline'

  return [
    {
      id: 'intervals',
      name: 'Intervals.icu',
      state: intervalsState,
      priority: 'training-load',
      lastSyncedAt: syncStatus.lastSyncedAt,
      recordCount: intervalCount || syncStatus.activityCount,
      detail: freshnessDetail(freshness, 'sync') ?? (syncStatus.state === 'fresh'
        ? 'Training load, recent activities, wellness, and race events through AERION Core.'
        : syncStatus.message),
      nextAction: syncStatus.state === 'fresh' ? 'Keep as primary training analytics source.' : 'Check local server credentials and opening sync.',
    },
    {
      id: 'garmin',
      name: 'Garmin',
      state: garminSignals > 0 ? 'connected' : 'not-connected',
      priority: 'recovery-truth',
      recordCount: garminSignals || undefined,
      detail: freshnessDetail(freshness, 'current-state') ?? (garminSignals > 0
        ? `${garminSignals} readiness signals available in normalized state.`
        : 'Adapter interface pending. Recovery fields exist; ingestion is not wired yet.'),
      nextAction: 'Add Garmin recovery snapshot adapter behind the server boundary.',
    },
    {
      id: 'strava',
      name: 'Strava',
      state: stravaCount > 0 ? 'connected' : 'not-connected',
      priority: 'activity-proof',
      recordCount: stravaCount || undefined,
      detail: freshnessDetail(freshness, 'activities') ?? (stravaCount > 0
        ? 'Strava activities are present as proof/enrichment source.'
        : 'OAuth/import adapter pending. Use for activity proof, routes, and external links — not recovery truth.'),
      nextAction: 'Add Strava OAuth/import adapter after source deduplication rules are in place.',
    },
    {
      id: 'manual',
      name: 'Manual / Local',
      state: 'local',
      priority: 'override',
      recordCount: manualCount,
      detail: 'Local fixtures, manual races, backups, and explicit overrides remain available.',
      nextAction: 'Keep as fallback and founder-controlled override layer.',
    },
  ]
}
