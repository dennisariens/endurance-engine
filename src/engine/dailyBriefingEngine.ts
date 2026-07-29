import type { Activity, DailyDecision, Race, WorkoutOption, WorkoutRecommendation } from '../domain/types'
import type { ActualOverride } from './actualOverrideEngine'
import type { CoachBriefing } from './coachBriefingEngine'
import { daysBetween } from './calendarEngine'
import type { Next72Plan } from './recoveryPlanEngine'

export type PlannedCalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  source: 'calendar' | 'manual' | 'race' | 'blocked'
}

export type DailyBriefing = {
  header: string
  statusLine: string
  recentActivity: {
    title: string
    detail: string
    effect: string
  }
  todayRecommendation: {
    primary: string
    caps: string[]
    alternatives: string[]
    hardNos: string[]
    why: string
  }
  calendar: {
    planned: string[]
    bestWindow: string
    conflicts: string[]
  }
  raceContext: string
  decision: {
    bestAction: string
    consequence: string
  }
  replyActions: string[]
  telegramText: string
}

type BuildDailyBriefingInput = {
  date: string
  timezone: string
  recentActivities: Activity[]
  actualOverride: ActualOverride
  decision: DailyDecision
  recommendation: WorkoutRecommendation
  next72Plan: Next72Plan
  coachBriefing: CoachBriefing
  calendarEvents?: PlannedCalendarEvent[]
  races?: Race[]
}

const replyActions = ['/accept', '/rest', '/easy', '/race', '/ignore', '/update', '/why', '/calendar', '/recent']

function formatDateHeader(date: string): string {
  const value = new Date(`${date}T00:00:00Z`)
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(value)
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(value)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(value)
  return `AERION DAILY — ${weekday} ${day} ${month}`
}

function formatMinutes(seconds?: number): string {
  if (!seconds) return 'duration n/a'
  const minutes = Math.round(seconds / 60)
  if (minutes < 90) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function formatEventTime(value: string): string {
  const match = value.match(/T(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  return value.slice(11, 16) || value
}

function latestActivity(activities: Activity[]): Activity | undefined {
  return [...activities].sort((a, b) => {
    const dateSort = b.date.localeCompare(a.date)
    if (dateSort !== 0) return dateSort
    return (b.load ?? 0) - (a.load ?? 0)
  })[0]
}

function buildRecentActivity(activities: Activity[], actualOverride: ActualOverride): DailyBriefing['recentActivity'] {
  const latest = latestActivity(activities)
  if (!latest) {
    return {
      title: 'No recent activity synced',
      detail: actualOverride.actualSummary,
      effect: 'Plan remains provisional until completed work or rest confirmation arrives.',
    }
  }

  const parts = [latest.name, formatMinutes(latest.durationSec), `load ${latest.load ?? 'n/a'}`]
  if (latest.avgHr) parts.push(`avg HR ${latest.avgHr}`)
  if (latest.normalizedPower) parts.push(`NP ${latest.normalizedPower}W`)
  if (latest.raceCost) parts.push(`race cost ${latest.raceCost}`)
  if (latest.raceCostBand) parts.push(latest.raceCostBand)

  return {
    title: parts.join(' · '),
    detail: actualOverride.deltaSummary,
    effect: actualOverride.authoritativeSource === 'completed-activity'
      ? 'Actual work is canonical; today recalculates from completed load, not intent.'
      : actualOverride.tomorrowImpact,
  }
}

function buildRecommendation(recommendation: WorkoutRecommendation, next72Plan: Next72Plan): DailyBriefing['todayRecommendation'] {
  const primary = recommendation.primary
  const caps: string[] = []
  if (primary.hrCap) caps.push(`HR ≤ ${primary.hrCap}`)
  if (primary.powerCap) caps.push(`Power ≤ ${primary.powerCap}W`)

  const alternatives = [recommendation.bike, recommendation.run]
    .filter((option): option is WorkoutOption => Boolean(option))
    .filter((option) => option.title !== primary.title)
    .map((option) => `${option.title} · ${option.durationMin} min`)

  const hardNos = Array.from(new Set([
    ...primary.cautions,
    ...next72Plan.blocks[0]?.hardLimits ?? [],
  ])).slice(0, 4)

  return {
    primary: `${primary.title} · ${primary.durationMin} min`,
    caps,
    alternatives,
    hardNos,
    why: primary.purpose,
  }
}

function sameIsoDate(value: string, date: string): boolean {
  return value.slice(0, 10) === date
}

function buildCalendar(date: string, events: PlannedCalendarEvent[]): DailyBriefing['calendar'] {
  const todaysEvents = events
    .filter((event) => sameIsoDate(event.start, date))
    .sort((a, b) => a.start.localeCompare(b.start))

  const planned = todaysEvents.map((event) => `${event.title} ${formatEventTime(event.start)}–${formatEventTime(event.end)}`)

  if (!todaysEvents.length) {
    return {
      planned: ['No fixed calendar activity loaded'],
      bestWindow: 'Open day — place training where fueling and recovery are easiest',
      conflicts: [],
    }
  }

  const windows: Array<{ start: string; end: string }> = []
  let cursor = '06:00'
  for (const event of todaysEvents) {
    const start = formatEventTime(event.start)
    const end = formatEventTime(event.end)
    if (start > cursor) windows.push({ start: cursor, end: start })
    if (end > cursor) cursor = end
  }
  if (cursor < '21:00') windows.push({ start: cursor, end: '21:00' })

  const best = windows
    .map((window) => ({ ...window, minutes: minutesBetween(window.start, window.end) }))
    .filter((window) => window.minutes >= 45)
    .sort((a, b) => b.minutes - a.minutes)[0]

  const conflicts = todaysEvents
    .filter((event) => formatEventTime(event.end) >= '18:30')
    .map((event) => `${event.title} compresses the evening recovery/fueling window`)

  return {
    planned,
    bestWindow: best ? `${best.start}–${best.end}` : 'No clean 45+ min window loaded',
    conflicts,
  }
}

function minutesBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
}

function buildRaceContext(date: string, decision: DailyDecision, races: Race[]): string {
  const nextRace = decision.nextRace ?? races
    .filter((race) => daysBetween(date, race.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (!nextRace) return 'No fixed race loaded.'
  const days = daysBetween(date, nextRace.date)
  const suffix = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
  return `${nextRace.name} ${suffix} · ${nextRace.priority}${nextRace.mandatory ? ' · mandatory' : ''}`
}

function buildDecision(calendar: DailyBriefing['calendar'], coachBriefing: CoachBriefing): DailyBriefing['decision'] {
  const slot = calendar.bestWindow.startsWith('No clean') ? 'the least disruptive available slot' : calendar.bestWindow
  return {
    bestAction: `Use ${slot} for the recommended session; downgrade to easy/rest if readiness deteriorates.`,
    consequence: coachBriefing.consequence,
  }
}

function renderTelegramText(briefing: Omit<DailyBriefing, 'telegramText'>): string {
  const caps = briefing.todayRecommendation.caps.length ? briefing.todayRecommendation.caps.join(' / ') : 'no cap loaded'
  const hardNos = briefing.todayRecommendation.hardNos.length ? briefing.todayRecommendation.hardNos.join(', ') : 'none loaded'
  const alternatives = briefing.todayRecommendation.alternatives.length ? `Alt: ${briefing.todayRecommendation.alternatives.join(' / ')}` : 'Alt: rest or easy movement if signals worsen'
  const conflicts = briefing.calendar.conflicts.length ? `Conflict: ${briefing.calendar.conflicts.join(' · ')}` : 'Conflict: none obvious'

  return [
    briefing.header,
    briefing.statusLine,
    '',
    '1. Recent activity',
    `${briefing.recentActivity.title}`,
    `Effect: ${briefing.recentActivity.effect}`,
    '',
    '2. Today recommendation',
    `Primary: ${briefing.todayRecommendation.primary}`,
    `Cap: ${caps}`,
    `Do not add: ${hardNos}`,
    `${alternatives}`,
    '',
    '3. Calendar / planned activity',
    `Today: ${briefing.calendar.planned.join('; ')}`,
    `Best window: ${briefing.calendar.bestWindow}`,
    `Race: ${briefing.raceContext}`,
    conflicts,
    '',
    '4. Decision',
    briefing.decision.bestAction,
    `If ignored: ${briefing.decision.consequence}`,
    '',
    `Reply: ${briefing.replyActions.join(' · ')}`,
  ].join('\n')
}

export function buildDailyBriefing(input: BuildDailyBriefingInput): DailyBriefing {
  const recentActivity = buildRecentActivity(input.recentActivities, input.actualOverride)
  const todayRecommendation = buildRecommendation(input.recommendation, input.next72Plan)
  const calendar = buildCalendar(input.date, input.calendarEvents ?? [])
  const raceContext = buildRaceContext(input.date, input.decision, input.races ?? [])
  const decision = buildDecision(calendar, input.coachBriefing)
  const briefingWithoutText = {
    header: formatDateHeader(input.date),
    statusLine: `Status: ${input.decision.status} · ${input.decision.mode} · confidence ${input.coachBriefing.confidence}`,
    recentActivity,
    todayRecommendation,
    calendar,
    raceContext,
    decision,
    replyActions,
  }

  return {
    ...briefingWithoutText,
    telegramText: renderTelegramText(briefingWithoutText),
  }
}
