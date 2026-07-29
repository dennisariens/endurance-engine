import type { Activity, Race } from '../../domain/types'

export type DedupeSourcePriority = Partial<Record<Activity['source'], number>>

export type ActivityDedupeOptions = {
  sourcePriority?: DedupeSourcePriority
}

const defaultSourcePriority: Record<Activity['source'], number> = {
  manual: 100,
  intervals: 80,
  garmin: 60,
  strava: 40,
}

export function dedupeSyncedActivities(activities: Activity[], options: ActivityDedupeOptions = {}): Activity[] {
  const priority = { ...defaultSourcePriority, ...options.sourcePriority }
  const manualActivities = activities.filter((activity) => activity.source === 'manual')
  const syncedActivities = activities.filter((activity) => activity.source !== 'manual')
  const byKey = new Map<string, Activity>()

  for (const activity of syncedActivities) {
    const key = activityDedupeKey(activity)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, activity)
      continue
    }

    byKey.set(key, mergeActivity(existing, activity, priority))
  }

  return [...manualActivities, ...byKey.values()].sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`))
}

export function mergeRacesByStableId(existing: Race[], incoming: Race[]): Race[] {
  const byId = new Map<string, Race>()
  for (const race of existing) byId.set(race.id, race)
  for (const race of incoming) {
    const current = byId.get(race.id)
    byId.set(race.id, current ? { ...race, ...definedFields(current) } : race)
  }
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function activityDedupeKey(activity: Activity): string {
  return [
    activity.date,
    normalizeType(activity.type),
    bucket(activity.durationSec, 300),
    bucket(activity.load, 10),
  ].join('|')
}

function mergeActivity(a: Activity, b: Activity, priority: Record<Activity['source'], number>): Activity {
  const winner = priority[b.source] > priority[a.source] ? b : a
  const loser = winner === a ? b : a
  return {
    ...loser,
    ...winner,
    durationSec: winner.durationSec ?? loser.durationSec,
    distanceM: winner.distanceM ?? loser.distanceM,
    load: winner.load ?? loser.load,
    avgHr: winner.avgHr ?? loser.avgHr,
    maxHr: winner.maxHr ?? loser.maxHr,
    normalizedPower: winner.normalizedPower ?? loser.normalizedPower,
    avgPower: winner.avgPower ?? loser.avgPower,
    raceCost: a.raceCost ?? b.raceCost,
    raceCostBand: a.raceCostBand ?? b.raceCostBand,
  }
}

function definedFields<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined && field !== null)) as Partial<T>
}

function normalizeType(type: string): string {
  if (/ride|bike|cycling|virtualride/i.test(type)) return 'ride'
  if (/run/i.test(type)) return 'run'
  if (/swim/i.test(type)) return 'swim'
  return type.trim().toLowerCase() || 'activity'
}

function bucket(value: number | undefined, size: number): string {
  if (value === undefined || !Number.isFinite(value)) return 'unknown'
  return String(Math.round(value / size) * size)
}
