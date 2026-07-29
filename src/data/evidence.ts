import type { Activity, ActivitySource, CurrentState, Goal, Race } from '../domain/types'
import type { FreshnessReport, FreshnessStatus } from './freshness'

export type EvidenceSource = ActivitySource | 'aerion' | 'derived'
export type EvidenceQuality = 'verified' | 'reported' | 'estimated' | 'stale' | 'missing'
export type EvidenceKind = 'activity' | 'wellness' | 'race' | 'goal' | 'freshness' | 'state'

export type EvidenceRecord<T = unknown> = {
  id: string
  athleteId: string
  kind: EvidenceKind
  source: EvidenceSource
  observedAt: string
  receivedAt: string
  value: T
  quality: EvidenceQuality
  confidence: number
  freshnessHours?: number
  provenance?: {
    externalId?: string
    adapterVersion?: string
    calculationVersion?: string
  }
}

export const EVIDENCE_SCHEMA_VERSION = 'evidence-v1'

function dateTime(value?: string | null): string | undefined {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

function statusQuality(status: FreshnessStatus | undefined): EvidenceQuality {
  if (status === 'stale') return 'stale'
  if (status === 'missing') return 'missing'
  if (status === 'aging') return 'estimated'
  return 'verified'
}

function sourceConfidence(source: EvidenceSource): number {
  if (source === 'manual') return 0.95
  if (source === 'intervals') return 0.9
  if (source === 'garmin') return 0.85
  if (source === 'strava') return 0.72
  if (source === 'derived') return 0.65
  return 0.8
}

function qualityConfidence(quality: EvidenceQuality): number {
  if (quality === 'verified') return 1
  if (quality === 'reported') return 0.85
  if (quality === 'estimated') return 0.68
  if (quality === 'stale') return 0.42
  return 0.2
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100))
}

function signalFor(freshness: FreshnessReport | undefined, source: 'activities' | 'current-state' | 'races' | 'sync') {
  return freshness?.signals.find((signal) => signal.source === source)
}

export function buildEvidenceRecords(input: {
  athleteId: string
  generatedAt: string
  state: CurrentState
  activities: Activity[]
  races: Race[]
  goals: Goal[]
  freshness?: FreshnessReport
}): EvidenceRecord[] {
  const { athleteId, generatedAt, state, activities, races, goals, freshness } = input
  const activityFreshness = signalFor(freshness, 'activities')
  const stateFreshness = signalFor(freshness, 'current-state')
  const raceFreshness = signalFor(freshness, 'races')
  const records: EvidenceRecord[] = []

  for (const activity of activities) {
    const quality = statusQuality(activityFreshness?.status)
    records.push({
      id: `activity:${activity.source}:${activity.id}`,
      athleteId,
      kind: 'activity',
      source: activity.source,
      observedAt: dateTime(activity.date) ?? generatedAt,
      receivedAt: generatedAt,
      value: activity,
      quality,
      confidence: clampConfidence(sourceConfidence(activity.source) * qualityConfidence(quality)),
      freshnessHours: activityFreshness?.ageDays === undefined ? undefined : activityFreshness.ageDays * 24,
      provenance: { externalId: activity.id, calculationVersion: EVIDENCE_SCHEMA_VERSION },
    })
  }

  const stateQuality = statusQuality(stateFreshness?.status)
  records.push({
    id: `state:current:${state.last_updated ?? 'missing'}`,
    athleteId,
    kind: 'state',
    source: 'derived',
    observedAt: dateTime(state.last_updated) ?? generatedAt,
    receivedAt: generatedAt,
    value: state,
    quality: stateQuality,
    confidence: clampConfidence(qualityConfidence(stateQuality)),
    freshnessHours: stateFreshness?.ageDays === undefined ? undefined : stateFreshness.ageDays * 24,
    provenance: { calculationVersion: EVIDENCE_SCHEMA_VERSION },
  })

  for (const race of races) {
    const quality = statusQuality(raceFreshness?.status)
    records.push({
      id: `race:${race.id}`,
      athleteId,
      kind: 'race',
      source: race.id.startsWith('intervals-') ? 'intervals' : 'manual',
      observedAt: dateTime(race.date) ?? generatedAt,
      receivedAt: generatedAt,
      value: race,
      quality,
      confidence: clampConfidence((race.mandatory ? 0.95 : 0.78) * qualityConfidence(quality)),
      freshnessHours: raceFreshness?.ageDays === undefined ? undefined : raceFreshness.ageDays * 24,
      provenance: { externalId: race.id, calculationVersion: EVIDENCE_SCHEMA_VERSION },
    })
  }

  for (const goal of goals) {
    records.push({
      id: `goal:${goal.id}`,
      athleteId,
      kind: 'goal',
      source: 'manual',
      observedAt: dateTime(goal.targetDate) ?? generatedAt,
      receivedAt: generatedAt,
      value: goal,
      quality: 'reported',
      confidence: 0.86,
      provenance: { externalId: goal.id, calculationVersion: EVIDENCE_SCHEMA_VERSION },
    })
  }

  if (freshness) {
    records.push({
      id: `freshness:${freshness.today}`,
      athleteId,
      kind: 'freshness',
      source: 'derived',
      observedAt: dateTime(freshness.today) ?? generatedAt,
      receivedAt: generatedAt,
      value: freshness,
      quality: freshness.overall === 'fresh' ? 'verified' : freshness.overall === 'missing' ? 'missing' : 'stale',
      confidence: freshness.overall === 'fresh' ? 0.9 : freshness.overall === 'aging' ? 0.65 : 0.35,
      provenance: { calculationVersion: EVIDENCE_SCHEMA_VERSION },
    })
  }

  return records
}
