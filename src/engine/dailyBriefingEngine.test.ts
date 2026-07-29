import { describe, expect, it } from 'vitest'
import type { Activity, DailyDecision, Race, WorkoutRecommendation } from '../domain/types'
import type { ActualOverride } from './actualOverrideEngine'
import type { CoachBriefing } from './coachBriefingEngine'
import type { Next72Plan } from './recoveryPlanEngine'
import { buildDailyBriefing } from './dailyBriefingEngine'

const recentActivity: Activity = {
  id: 'activity-1',
  source: 'intervals',
  date: '2026-05-17',
  name: 'Evening Endurance Ride',
  type: 'Ride',
  durationSec: 3720,
  load: 54,
  avgHr: 137,
  normalizedPower: 178,
  raceCost: 42,
  raceCostBand: 'Medium',
}

const decision: DailyDecision = {
  date: '2026-05-18',
  status: 'Yellow',
  mode: 'Build',
  today: 'Z2',
  hrCap: 143,
  powerCap: 185,
  coreAllowed: true,
  strengthAllowed: false,
  fastingAllowed: false,
  raceWeightAllowed: false,
  nextRace: {
    id: 'race-1',
    date: '2026-05-21',
    name: 'Sort-like Thursday Crit',
    discipline: 'cycling',
    priority: 'fixed',
    mandatory: true,
    distanceKm: 48,
  },
  daysUntilNextRace: 3,
  raceBlock: { active: false, racesWithin72h: 1, racesWithin7d: 1, reason: 'No race block active' },
  reasons: ['Race proximity is active', 'Recovery is yellow'],
}

const recommendation: WorkoutRecommendation = {
  primary: {
    discipline: 'bike',
    title: 'Aerobic bike endurance',
    durationMin: 60,
    intensity: 'z2',
    hrCap: 143,
    powerCap: 185,
    purpose: 'Build aerobic volume without adding race-cost debt.',
    steps: ['10 min easy ramp', 'Main block steady Z2', '5 min cool-down'],
    cautions: ['No threshold scraps', 'No strength work'],
  },
  bike: {
    discipline: 'bike',
    title: 'Aerobic bike endurance',
    durationMin: 60,
    intensity: 'z2',
    hrCap: 143,
    powerCap: 185,
    purpose: 'Build aerobic volume without adding race-cost debt.',
    steps: [],
    cautions: ['No threshold scraps'],
  },
  goalReminder: 'Protect the fixed race calendar.',
  longTermBias: 'Choose low-cost aerobic work over grey-zone enthusiasm.',
}

const actualOverride: ActualOverride = {
  status: 'actual-without-log',
  authoritativeSource: 'completed-activity',
  severity: 'yellow',
  headline: 'Completed activity overrides the plan/log.',
  plannedSummary: 'Aerobic bike endurance · 60 min · HR ≤ 143 · Power ≤ 185',
  loggedSummary: 'No logged intent yet',
  actualSummary: 'Evening Endurance Ride · 62 min · load 54 · avg HR 137 · NP 178W · race cost 42',
  deltaSummary: 'Completed activity exists without a logged scenario. Actual work becomes canonical.',
  tomorrowImpact: 'Tomorrow should recalculate from completed load, duration, HR/power, race-like classification, and morning readiness.',
}

const next72Plan: Next72Plan = {
  summary: 'Race proximity is active. Preserve freshness and keep all optional work boring.',
  risk: 'Medium',
  blocks: [
    {
      horizon: 'Today',
      date: '2026-05-18',
      action: 'Freshness preservation',
      allowedWork: ['Easy spin', 'Short run-walk', 'Mobility'],
      hardLimits: ['HR ≤ 143 · provisional ceiling', 'No grey-zone work', 'No strength'],
      why: 'Fitness will not be improved meaningfully this close to racing.',
      tone: 'yellow',
    },
  ],
}

const coachBriefing: CoachBriefing = {
  headline: 'Controlled build. Useful work, low drama.',
  status: 'Build · Yellow. Next race: Sort-like Thursday Crit.',
  recommendation: 'Aerobic bike endurance · 60 min',
  consequence: 'If you exceed the cap, the cost is not today’s workout; it is the next 48–72h recovery budget.',
  nextAction: 'Stay under the cap and log the decision so AERION can adapt from actual behavior.',
  confidence: 'medium',
  tone: 'yellow',
  dominantConstraint: 'race proximity',
  missingSignals: ['Training Readiness'],
}

const calendarEvents = [
  { id: 'work-1', title: 'Deep work block', start: '2026-05-18T09:00:00+02:00', end: '2026-05-18T12:00:00+02:00', source: 'calendar' as const },
  { id: 'dinner-1', title: 'Dinner', start: '2026-05-18T19:00:00+02:00', end: '2026-05-18T20:30:00+02:00', source: 'calendar' as const },
]

const races: Race[] = [decision.nextRace!]

describe('buildDailyBriefing', () => {
  it('builds a structured daily briefing from recent activity, recommendation, and calendar context', () => {
    const briefing = buildDailyBriefing({
      date: '2026-05-18',
      timezone: 'Europe/Amsterdam',
      recentActivities: [recentActivity],
      actualOverride,
      decision,
      recommendation,
      next72Plan,
      coachBriefing,
      calendarEvents,
      races,
    })

    expect(briefing.header).toEqual('AERION DAILY — Mon 18 May')
    expect(briefing.statusLine).toBe('Status: Yellow · Build · confidence medium')
    expect(briefing.recentActivity.title).toContain('Evening Endurance Ride')
    expect(briefing.recentActivity.effect).toContain('Actual work is canonical')
    expect(briefing.todayRecommendation.primary).toContain('Aerobic bike endurance · 60 min')
    expect(briefing.todayRecommendation.caps).toEqual(['HR ≤ 143', 'Power ≤ 185W'])
    expect(briefing.calendar.planned).toContain('Deep work block 09:00–12:00')
    expect(briefing.calendar.bestWindow).toBe('12:00–19:00')
    expect(briefing.raceContext).toContain('Sort-like Thursday Crit in 3 days')
    expect(briefing.decision.bestAction).toContain('12:00–19:00')
    expect(briefing.replyActions).toEqual(['/accept', '/rest', '/easy', '/race', '/ignore', '/update', '/why', '/calendar', '/recent'])
  })

  it('renders concise Telegram text with the required briefing sections and reply commands', () => {
    const briefing = buildDailyBriefing({
      date: '2026-05-18',
      timezone: 'Europe/Amsterdam',
      recentActivities: [recentActivity],
      actualOverride,
      decision,
      recommendation,
      next72Plan,
      coachBriefing,
      calendarEvents,
      races,
    })

    expect(briefing.telegramText).toContain('AERION DAILY — Mon 18 May')
    expect(briefing.telegramText).toContain('1. Recent activity')
    expect(briefing.telegramText).toContain('2. Today recommendation')
    expect(briefing.telegramText).toContain('3. Calendar / planned activity')
    expect(briefing.telegramText).toContain('4. Decision')
    expect(briefing.telegramText).toContain('/accept · /rest · /easy · /race · /ignore · /update · /why · /calendar · /recent')
    expect(briefing.telegramText.length).toBeLessThan(1600)
  })
})
