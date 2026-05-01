import type { Activity, DecisionLogEntry, Race } from '../domain/types'

export type TimelineKind = 'race' | 'actual' | 'decision'
export type TimelineStatus = 'scheduled' | 'actual-no-plan-click' | 'completed-after-acceptance' | 'decision-only' | 'override' | 'rested'

export type TimelineItem = {
  id: string
  date: string
  kind: TimelineKind
  status: TimelineStatus
  label: string
  detail: string
  tone: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate'
  source?: Activity['source'] | 'decision' | 'calendar'
}

export function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function mergeActivitiesById(input: { current: Activity[]; incoming: Activity[] }): Activity[] {
  const byId = new Map<string, Activity>()
  for (const activity of input.current) byId.set(activity.id, activity)
  for (const activity of input.incoming) byId.set(activity.id, activity)
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export function buildOperationalTimeline(input: { today: string; races: Race[]; activities: Activity[]; decisions: DecisionLogEntry[] }): TimelineItem[] {
  const decisionByDate = new Map(input.decisions.map((decision) => [decision.date, decision]))
  const activityDates = new Set(input.activities.map((activity) => activity.date))
  const items: TimelineItem[] = []

  for (const race of input.races) {
    if (race.date < input.today) continue
    items.push({
      id: `race:${race.id}`,
      date: race.date,
      kind: 'race',
      status: 'scheduled',
      label: race.name,
      detail: `${race.series ?? 'Race'} · ${race.distanceKm ?? 'TBD'} km · ${race.priority}`,
      tone: 'blue',
      source: 'calendar',
    })
  }

  for (const activity of input.activities) {
    const decision = decisionByDate.get(activity.date)
    items.push({
      id: `activity:${activity.id}`,
      date: activity.date,
      kind: 'actual',
      status: decision?.action === 'accepted' ? 'completed-after-acceptance' : 'actual-no-plan-click',
      label: activity.name,
      detail: `${activity.type} · ${formatDuration(activity.durationSec)} · load ${activity.load ?? 'n/a'}`,
      tone: decision?.action === 'accepted' ? 'green' : 'yellow',
      source: activity.source,
    })
  }

  for (const decision of input.decisions) {
    if (activityDates.has(decision.date)) continue
    items.push({
      id: `decision:${decision.id}`,
      date: decision.date,
      kind: 'decision',
      status: decision.action === 'rested' ? 'rested' : decision.action === 'overridden' ? 'override' : 'decision-only',
      label: decision.workoutTitle,
      detail: `${decision.action} · ${decision.reason}`,
      tone: decision.action === 'rested' ? 'blue' : decision.action === 'overridden' ? 'red' : 'slate',
      source: 'decision',
    })
  }

  return items.sort((a, b) => sortByOperationalRelevance(a, b, input.today))
}

function sortByOperationalRelevance(a: TimelineItem, b: TimelineItem, today: string): number {
  const aDistance = Math.abs(dayDistance(today, a.date))
  const bDistance = Math.abs(dayDistance(today, b.date))
  if (aDistance !== bDistance) return aDistance - bDistance
  const dateSort = b.date.localeCompare(a.date)
  if (dateSort !== 0) return dateSort
  return kindOrder(a.kind) - kindOrder(b.kind)
}

function dayDistance(from: string, to: string): number {
  const fromMs = new Date(`${from}T00:00:00`).getTime()
  const toMs = new Date(`${to}T00:00:00`).getTime()
  return Math.round((toMs - fromMs) / 86_400_000)
}

function kindOrder(kind: TimelineKind): number {
  if (kind === 'race') return 0
  if (kind === 'actual') return 1
  return 2
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'duration n/a'
  const minutes = Math.round(seconds / 60)
  if (minutes < 90) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
