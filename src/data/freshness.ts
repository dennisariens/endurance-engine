import type { Activity, CurrentState, Race } from '../domain/types'

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'missing'
export type FreshnessSource = 'current-state' | 'activities' | 'races' | 'sync'

export type FreshnessSignal = {
  source: FreshnessSource
  status: FreshnessStatus
  date?: string
  ageDays?: number
  message: string
}

export type FreshnessReport = {
  today: string
  overall: FreshnessStatus
  signals: FreshnessSignal[]
  staleSources: FreshnessSource[]
}

const thresholds: Record<FreshnessSource, { aging: number; stale: number }> = {
  'current-state': { aging: 2, stale: 7 },
  activities: { aging: 4, stale: 14 },
  races: { aging: 14, stale: 45 },
  sync: { aging: 1, stale: 3 },
}

function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0]
}

export function daysOld(today: string, value?: string | null): number | undefined {
  const date = isoDate(value)
  if (!date) return undefined
  const start = new Date(`${date}T00:00:00Z`).getTime()
  const end = new Date(`${today}T00:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

function classify(source: FreshnessSource, today: string, date?: string | null): Pick<FreshnessSignal, 'status' | 'ageDays'> {
  const ageDays = daysOld(today, date)
  if (ageDays === undefined) return { status: 'missing' }
  const threshold = thresholds[source]
  if (ageDays >= threshold.stale) return { status: 'stale', ageDays }
  if (ageDays >= threshold.aging) return { status: 'aging', ageDays }
  return { status: 'fresh', ageDays }
}

function latestActivityDate(activities: Activity[]): string | undefined {
  const dates = activities.map((activity) => isoDate(activity.date)).filter((date): date is string => Boolean(date)).sort()
  return dates[dates.length - 1]
}

function nextRaceDate(today: string, races: Race[]): string | undefined {
  return races
    .map((race) => isoDate(race.date))
    .filter((date): date is string => Boolean(date))
    .filter((date) => date >= today)
    .sort()[0]
}

function signal(source: FreshnessSource, today: string, date: string | undefined, label: string): FreshnessSignal {
  const result = classify(source, today, date)
  const age = result.ageDays === undefined ? 'unknown age' : `${result.ageDays}d old`
  return {
    source,
    date,
    ...result,
    message: result.status === 'missing'
      ? `${label} is missing.`
      : `${label} is ${result.status} (${age}).`,
  }
}

function worstStatus(signals: FreshnessSignal[]): FreshnessStatus {
  const order: FreshnessStatus[] = ['fresh', 'aging', 'stale', 'missing']
  return signals.reduce((worst, item) => order.indexOf(item.status) > order.indexOf(worst) ? item.status : worst, 'fresh' as FreshnessStatus)
}

export function buildFreshnessReport(input: { today: string; state: CurrentState; activities: Activity[]; races: Race[]; syncedAt?: string }): FreshnessReport {
  const { today, state, activities, races, syncedAt } = input
  const signals = [
    signal('current-state', today, isoDate(state.last_updated), 'Current recovery/readiness state'),
    signal('activities', today, latestActivityDate(activities), 'Latest activity evidence'),
    signal('races', today, nextRaceDate(today, races), 'Next fixed race'),
    signal('sync', today, isoDate(syncedAt), 'Opening sync receipt'),
  ]
  return {
    today,
    overall: worstStatus(signals),
    signals,
    staleSources: signals.filter((item) => item.status === 'stale' || item.status === 'missing').map((item) => item.source),
  }
}
