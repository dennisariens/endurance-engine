import type { Activity, CurrentState, Goal, Race } from '../domain/types'

export const MARATHON_BLOCK_ENGINE_VERSION = 'marathon-block-v1'

export type MarathonBlockPhase = 'not-active' | 'foundation' | 'build' | 'specific' | 'taper' | 'race-week' | 'post-race-continuity'

export type MarathonBlockOutput = {
  engineVersion: string
  active: boolean
  mission: string
  daysToRace: number | null
  phase: MarathonBlockPhase
  priorityStack: string[]
  easyEfficiency: {
    markerHrRange: string
    currentReference: string
    coolWeatherEquivalent: string
    raceDayExpected: string
    sixMonthExpected: string
    instruction: string
    interpretation: string
  }
  longRunPlacement: {
    recommendation: 'weekend' | 'weekday' | 'flex'
    reason: string
    protectedWeekendEvents: string[]
  }
  weekRules: string[]
  cyclingPolicy: string
  decisionRules: string[]
  notes: string[]
}

type Input = {
  today: string
  activeGoal?: Goal
  goals?: Goal[]
  races: Race[]
  activities: Activity[]
  state: CurrentState
}

function daysBetween(from: string, to?: string | null): number | null {
  if (!to) return null
  const start = new Date(`${from}T00:00:00Z`).getTime()
  const end = new Date(`${to}T00:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86_400_000)
}

function isMarathonGoal(goal?: Goal): boolean {
  if (!goal) return false
  const haystack = `${goal.name} ${goal.description ?? ''} ${goal.targetMetric ?? ''} ${goal.targetValue ?? ''}`.toLowerCase()
  return goal.discipline === 'running' && haystack.includes('marathon')
}

function selectMissionGoal(input: Input): Goal | undefined {
  if (isMarathonGoal(input.activeGoal)) return input.activeGoal
  return input.goals?.find(isMarathonGoal)
}

function phaseFor(daysToRace: number | null, active: boolean): MarathonBlockPhase {
  if (!active || daysToRace === null) return active ? 'build' : 'not-active'
  if (daysToRace < 0) return 'post-race-continuity'
  if (daysToRace <= 7) return 'race-week'
  if (daysToRace <= 14) return 'taper'
  if (daysToRace <= 56) return 'specific'
  if (daysToRace <= 98) return 'build'
  return 'foundation'
}

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

function isProtectedCyclingEvent(race: Race): boolean {
  const haystack = `${race.name} ${race.series ?? ''} ${race.notes ?? ''}`.toLowerCase()
  return race.discipline === 'cycling' && (haystack.includes('chasing red') || haystack.includes('worlds') || haystack.includes('ttt'))
}

function protectedWeekendEvents(races: Race[], today: string): Race[] {
  return races
    .filter((race) => {
      const days = daysBetween(today, race.date)
      return days !== null && days >= 0 && days <= 56 && isWeekend(race.date) && isProtectedCyclingEvent(race)
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function longRunPlacementFor(events: Race[], phase: MarathonBlockPhase): MarathonBlockOutput['longRunPlacement'] {
  if (phase === 'race-week' || phase === 'taper') {
    return {
      recommendation: 'flex',
      reason: 'Race proximity overrides normal long-run rhythm; preserve freshness before adding distance.',
      protectedWeekendEvents: events.map((event) => `${event.date} · ${event.name}`),
    }
  }
  if (events.length > 0) {
    return {
      recommendation: 'weekday',
      reason: 'Protected Chasing Red/Worlds/TTT weekends are loaded; move the long run midweek rather than stacking it on top of race cost.',
      protectedWeekendEvents: events.map((event) => `${event.date} · ${event.name}`),
    }
  }
  return {
    recommendation: 'weekend',
    reason: 'No protected weekend race block detected; keep the long run on the weekend for durability rhythm.',
    protectedWeekendEvents: [],
  }
}

function weekRulesFor(phase: MarathonBlockPhase): string[] {
  if (phase === 'post-race-continuity') return ['Recover first, then keep 4 runs most weeks so running adaptations do not collapse.', 'Let cycling rise again, but protect 40–60 km/week running once stable.', 'Do not turn December into a full reset unless injury or illness forces it.']
  if (phase === 'race-week') return ['No durability experiments.', 'Keep runs short enough to sharpen without adding damage.', 'Use Garmin/readiness and actual legs to decide final freshness work.']
  if (phase === 'taper') return ['Reduce volume before reducing frequency.', 'Keep one controlled marathon-pace touch only if recovery is green.', 'Protect sleep, HRV, and connective-tissue freshness.']
  if (phase === 'specific') return ['Long runs answer what 4:15/km costs after 20–30+ km.', 'Keep easy runs governed by HR, not ego.', 'Cycling quality must earn its recovery cost.']
  return ['Build repeatable run frequency before exotic workouts.', 'Progress the long run without panic jumps.', 'Use cycling to support the aerobic engine, not to hide missing run durability.']
}

function cyclingPolicyFor(phase: MarathonBlockPhase): string {
  if (phase === 'race-week' || phase === 'taper') return 'Cycling is maintenance only unless it is an intentional, low-cost opener.'
  if (phase === 'specific') return 'Zwift races/TTTs can stay when they matter, but AERION must price their recovery cost against marathon durability.'
  if (phase === 'post-race-continuity') return 'Cycling can become more prominent again while 4–5 weekly runs preserve the running engine.'
  return 'Cycling supports the aerobic engine; do not let it replace the minimum running frequency needed for marathon adaptation.'
}

function latestEasyRunAtMarker(activities: Activity[]): Activity | undefined {
  return [...activities]
    .filter((activity) => activity.type.toLowerCase().includes('run') && activity.avgHr !== undefined && activity.avgHr >= 124 && activity.avgHr <= 136 && (activity.durationSec ?? 0) >= 1_800)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

export function buildMarathonBlock(input: Input): MarathonBlockOutput {
  const missionGoal = selectMissionGoal(input)
  const active = Boolean(missionGoal)
  const daysToRace = daysBetween(input.today, missionGoal?.targetDate)
  const phase = phaseFor(daysToRace, active)
  const events = protectedWeekendEvents(input.races, input.today)
  const latestMarkerRun = latestEasyRunAtMarker(input.activities)
  const healthBlocked = input.state.injury_present || input.state.illness_present

  return {
    engineVersion: MARATHON_BLOCK_ENGINE_VERSION,
    active,
    mission: missionGoal ? `${missionGoal.name}${missionGoal.targetDate ? ` · ${missionGoal.targetDate}` : ''}` : 'No marathon mission loaded',
    daysToRace,
    phase,
    priorityStack: ['Marathon performance first', 'Run durability', 'Aerobic efficiency', 'Cycling only when it supports the mission or consciously earns its recovery cost'],
    easyEfficiency: {
      markerHrRange: '129–132 bpm',
      currentReference: latestMarkerRun ? `${latestMarkerRun.date} · ${latestMarkerRun.name} · ${latestMarkerRun.avgHr} bpm` : '57 min · 5:54/km · 129 bpm · ~29°C reference run',
      coolWeatherEquivalent: '~5:30–5:45/km now',
      raceDayExpected: '~5:00–5:15/km at 130 bpm by race day; ~5:05/km central expectation',
      sixMonthExpected: '~4:45–4:50/km central winter-continuity estimate',
      instruction: 'Do not chase this pace; cap the easy effort by HR and let AERION detect the trend.',
      interpretation: 'The target is a right-shift of the whole HR–pace curve, not a single heroic easy run.',
    },
    longRunPlacement: longRunPlacementFor(events, phase),
    weekRules: weekRulesFor(phase),
    cyclingPolicy: cyclingPolicyFor(phase),
    decisionRules: [
      healthBlocked ? 'Injury/illness can override the fixed marathon objective.' : 'Fixed marathon stays fixed; recommendations adapt around it.',
      'Actual completed training is authoritative over the intended plan.',
      'Move long runs around protected cycling weekends instead of stacking major stress blindly.',
      'Assess hard Zwift/TTT sessions as quality with a recovery invoice, not as free aerobic work.',
    ],
    notes: [
      'Use 130-bpm pace as an efficiency scoreboard, corrected for heat, drift, duration, fatigue, and placement relative to cycling.',
      'Sub-3 depends on what 4:15/km costs after 20, 25, and 30+ km, not on easy pace alone.',
      'After the marathon, avoid losing the adaptation by dropping to occasional running only.',
    ],
  }
}
