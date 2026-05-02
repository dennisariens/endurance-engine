import type { Activity, DecisionLogEntry, Race } from '../domain/types'

export type TimelineKind = 'race' | 'actual' | 'decision'
export type TimelineStatus = 'scheduled' | 'race-completed' | 'actual-no-plan-click' | 'completed-after-acceptance' | 'decision-only' | 'override' | 'rested'

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
  const idBySemanticKey = new Map<string, string>()

  const upsert = (activity: Activity) => {
    const semanticKey = getActivitySemanticKey(activity)
    const matchedId = semanticKey ? idBySemanticKey.get(semanticKey) : undefined
    if (semanticKey && matchedId && matchedId !== activity.id) {
      const matched = byId.get(matchedId)
      byId.delete(matchedId)
      byId.set(activity.id, mergeActivityFacts(matched, activity))
      idBySemanticKey.set(semanticKey, activity.id)
      return
    }

    const existing = byId.get(activity.id)
    byId.set(activity.id, mergeActivityFacts(existing, activity))
    if (semanticKey) idBySemanticKey.set(semanticKey, activity.id)
  }

  for (const activity of input.current) upsert(activity)
  for (const activity of input.incoming) upsert(activity)
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export function mergeRacesById(input: { current: Race[]; incoming: Race[] }): Race[] {
  const byId = new Map<string, Race>()
  for (const race of input.current) byId.set(race.id, race)
  for (const race of input.incoming) byId.set(race.id, race)
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function isRaceLikeActivity(activity: Activity): boolean {
  return typeof activity.raceCost === 'number'
    || /\brace\b|racing|zwift racing league|ecro|criterium|crit\b|tt\b|time trial|gran fondo|stage/i.test(`${activity.name} ${activity.type}`)
}

function getActivitySemanticKey(activity: Activity): string | undefined {
  if (activity.source === 'manual') return undefined
  if (!activity.date || !activity.type || !activity.durationSec) return undefined
  const durationBucket = Math.round(activity.durationSec / 5) * 5
  const loadBucket = typeof activity.load === 'number' ? Math.round(activity.load) : 'no-load'
  return [activity.date, activity.type.toLowerCase(), durationBucket, loadBucket].join('|')
}

function mergeActivityFacts(existing: Activity | undefined, incoming: Activity): Activity {
  if (!existing) return incoming
  return {
    ...existing,
    ...incoming,
    raceCost: incoming.raceCost ?? existing.raceCost,
  }
}

export function buildOperationalTimeline(input: { today: string; races: Race[]; activities: Activity[]; decisions: DecisionLogEntry[] }): TimelineItem[] {
  const decisionByDate = new Map(input.decisions.map((decision) => [decision.date, decision]))
  const activityDates = new Set(input.activities.map((activity) => activity.date))
  const completedRaceActivityDates = new Set(input.activities.filter(isRaceLikeActivity).map((activity) => activity.date))
  const items: TimelineItem[] = []

  for (const race of input.races) {
    if (race.date < input.today) continue
    if (race.date <= input.today && completedRaceActivityDates.has(race.date)) continue
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
    const raceLike = isRaceLikeActivity(activity)
    items.push({
      id: `${raceLike ? 'race-activity' : 'activity'}:${activity.id}`,
      date: activity.date,
      kind: raceLike ? 'race' : 'actual',
      status: raceLike ? 'race-completed' : decision?.action === 'accepted' ? 'completed-after-acceptance' : 'actual-no-plan-click',
      label: activity.name,
      detail: `${raceLike ? 'Race activity' : activity.type} · ${formatDuration(activity.durationSec)} · load ${activity.load ?? 'n/a'}`,
      tone: raceLike ? 'red' : decision?.action === 'accepted' ? 'green' : 'yellow',
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
