import type { Activity, CurrentState, Goal, GoalDiscipline, Race } from '../domain/types'
import type { EvidenceRecord } from '../data/evidence'
import type { FreshnessReport, FreshnessStatus } from '../data/freshness'

export type CanonicalFreshnessOverall = 'fresh' | 'partial' | 'stale'
export type CanonicalHealthStatus = 'clear' | 'watch' | 'limited' | 'blocked'
export type CanonicalRecoveryStatus = 'green' | 'yellow' | 'red' | 'blocked'
export type GoalPhase = 'foundation' | 'development' | 'specific' | 'peak' | 'taper' | 'race' | 'recovery'
export type GoalPriority = 'A' | 'B' | 'C'

export type Constraint = {
  id: string
  type: 'health' | 'recovery' | 'calendar' | 'load' | 'availability' | 'goal' | 'athlete-rule'
  severity: 'advisory' | 'soft' | 'hard'
  validFrom: string
  validUntil?: string
  reason: string
  evidenceIds: string[]
}

export type GoalState = {
  goalId: string
  name: string
  discipline: 'running' | 'cycling' | 'triathlon' | 'ultra'
  eventDate: string
  priority: GoalPriority
  target?: {
    timeSeconds?: number
    distanceKm?: number
    outcome?: string
  }
  phase: GoalPhase
  weeksRemaining: number
  readiness: {
    overall: number
    speed: number
    aerobicEndurance: number
    durability: number
    recoveryCapacity: number
    executionReadiness: number
    confidence: number
  }
  limitingFactors: string[]
}

export type CanonicalAthleteState = {
  athleteId: string
  generatedAt: string
  stateVersion: string
  identity: {
    age?: number
    sex?: 'male' | 'female' | 'other'
    bodyMassKg?: number
    heightCm?: number
  }
  freshness: {
    activitiesUpdatedAt?: string
    recoveryUpdatedAt?: string
    wellnessUpdatedAt?: string
    calendarUpdatedAt?: string
    overall: CanonicalFreshnessOverall
  }
  recovery: {
    status: CanonicalRecoveryStatus
    score?: number
    confidence: number
    dominantSignals: string[]
    missingSignals: string[]
  }
  fatigue: {
    acuteLoad?: number
    chronicLoad?: number
    loadBalance?: number
    neuromuscular?: number
    metabolic?: number
    musculoskeletal?: number
    subjective?: number
    confidence: number
  }
  fitness: {
    aerobicCapacity?: number
    thresholdCapacity?: number
    speedReserve?: number
    endurance?: number
    durability?: number
    fatigueResistance?: number
    confidence: number
  }
  health: {
    injuryStatus: CanonicalHealthStatus
    illnessStatus: CanonicalHealthStatus
    soreness?: number
    pain?: number
    notes?: string[]
  }
  behaviour: {
    complianceRate?: number
    completionRate?: number
    tendencyToOverreach?: number
    tendencyToUndershoot?: number
    preferredTrainingDays?: string[]
    confidence: number
  }
  availability: {
    todayMinutes?: number
    weeklyHours?: number
    blockedDates: string[]
  }
  activeGoal?: GoalState
  upcomingConstraints: Constraint[]
  evidenceSummary: {
    includedEvidenceIds: string[]
    excludedEvidenceIds: string[]
    warnings: string[]
  }
}

export const CANONICAL_ATHLETE_STATE_VERSION = 'canonical-athlete-state-v2-draft-1'

function isoDate(value?: string | null): string | undefined {
  return value?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
}

function daysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime()
  const endMs = new Date(`${end}T00:00:00Z`).getTime()
  return Math.round((endMs - startMs) / 86_400_000)
}

function latestDate(values: Array<string | undefined>): string | undefined {
  const dates = values.filter((value): value is string => Boolean(value)).sort()
  return dates[dates.length - 1]
}

function freshnessOverall(status: FreshnessStatus): CanonicalFreshnessOverall {
  if (status === 'fresh') return 'fresh'
  if (status === 'aging') return 'partial'
  return 'stale'
}

function freshnessDate(report: FreshnessReport, source: FreshnessReport['signals'][number]['source']): string | undefined {
  return report.signals.find((signal) => signal.source === source)?.date
}

function confidenceFromFreshness(status: FreshnessStatus | undefined): number {
  if (status === 'fresh') return 0.9
  if (status === 'aging') return 0.68
  if (status === 'stale') return 0.42
  return 0.25
}

function confidence(status: FreshnessStatus | undefined, completeness: number): number {
  return Math.max(0.1, Math.min(0.95, Math.round(confidenceFromFreshness(status) * completeness * 100) / 100))
}

function recoveryStatus(state: CurrentState): CanonicalRecoveryStatus {
  if (state.injury_present || state.illness_present) return 'blocked'
  if (state.recovery_status === 'unknown') return 'yellow'
  return state.recovery_status
}

function healthStatus(present: boolean): CanonicalHealthStatus {
  return present ? 'blocked' : 'clear'
}

function recentLoad(activities: Activity[], today: string, windowDays: number): number | undefined {
  const load = activities
    .filter((activity) => {
      const date = isoDate(activity.date)
      if (!date || activity.load == null) return false
      const age = daysBetween(date, today)
      return age >= 0 && age < windowDays
    })
    .reduce((sum, activity) => sum + (activity.load ?? 0), 0)
  return load > 0 ? Math.round(load) : undefined
}

function longestRunKm(activities: Activity[], today: string, windowDays: number): number | undefined {
  const distances = activities
    .filter((activity) => {
      const date = isoDate(activity.date)
      if (!date || !activity.type.toLowerCase().includes('run')) return false
      const age = daysBetween(date, today)
      return age >= 0 && age < windowDays
    })
    .map((activity) => activity.distanceM ? activity.distanceM / 1000 : 0)
  const max = Math.max(0, ...distances)
  return max > 0 ? Math.round(max * 10) / 10 : undefined
}

function completionRate(activities: Activity[], today: string): number | undefined {
  const recent = activities.filter((activity) => {
    const date = isoDate(activity.date)
    if (!date) return false
    const age = daysBetween(date, today)
    return age >= 0 && age < 28
  })
  if (!recent.length) return undefined
  return Math.min(1, Math.round((recent.length / 16) * 100) / 100)
}

function discipline(value: GoalDiscipline | undefined): GoalState['discipline'] {
  if (value === 'cycling') return 'cycling'
  if (value === 'triathlon') return 'triathlon'
  if (value === 'running') return 'running'
  return 'running'
}

function priority(goal: Goal | undefined): GoalPriority {
  if (goal?.priority === 'high' || goal?.status === 'mandatory' || goal?.status === 'key-event') return 'A'
  if (goal?.priority === 'medium' || goal?.status === 'committed') return 'B'
  return 'C'
}

function goalPhase(weeksRemaining: number): GoalPhase {
  if (weeksRemaining <= 0) return 'race'
  if (weeksRemaining <= 2) return 'taper'
  if (weeksRemaining <= 6) return 'peak'
  if (weeksRemaining <= 12) return 'specific'
  if (weeksRemaining <= 20) return 'development'
  return 'foundation'
}

function parseTimeTarget(goal: Goal | undefined): number | undefined {
  const value = goal?.targetValue ?? goal?.targetMetric ?? ''
  if (/sub\s*3/i.test(value) || /3:00/.test(value)) return 10_800
  return undefined
}

function buildActiveGoal(goal: Goal | undefined, today: string, activities: Activity[], state: CurrentState, evidenceIds: string[]): GoalState | undefined {
  if (!goal?.targetDate) return undefined
  const daysRemaining = Math.max(0, daysBetween(today, goal.targetDate))
  const weeksRemaining = Math.max(0, Math.ceil(daysRemaining / 7))
  const load7 = recentLoad(activities, today, 7) ?? 0
  const longRun = longestRunKm(activities, today, 70) ?? 0
  const recoveryScore = state.recovery_score ?? (state.recovery_status === 'green' ? 75 : state.recovery_status === 'yellow' ? 55 : 35)
  const speed = state.vo2max ? Math.min(100, Math.max(35, Math.round(state.vo2max * 1.7))) : 52
  const aerobicEndurance = Math.min(100, Math.round(load7 * 0.9 + 25))
  const durability = Math.min(100, Math.round(longRun * 2.4 + 20))
  const recoveryCapacity = Math.min(100, Math.max(10, Math.round(recoveryScore)))
  const executionReadiness = goal.status === 'committed' || goal.status === 'mandatory' ? 65 : 45
  const overall = Math.round((speed + aerobicEndurance + durability + recoveryCapacity + executionReadiness) / 5)
  const limitingFactors = [
    durability < 70 ? 'marathon durability' : undefined,
    aerobicEndurance < 70 ? 'weekly aerobic volume' : undefined,
    executionReadiness < 70 ? 'race execution validation' : undefined,
    recoveryCapacity < 55 ? 'recovery consistency' : undefined,
  ].filter((factor): factor is string => Boolean(factor))

  return {
    goalId: goal.id,
    name: goal.name,
    discipline: discipline(goal.discipline),
    eventDate: goal.targetDate,
    priority: priority(goal),
    target: {
      timeSeconds: parseTimeTarget(goal),
      outcome: goal.targetValue ?? goal.targetMetric ?? goal.description,
    },
    phase: goalPhase(weeksRemaining),
    weeksRemaining,
    readiness: {
      overall,
      speed,
      aerobicEndurance,
      durability,
      recoveryCapacity,
      executionReadiness,
      confidence: evidenceIds.length ? 0.56 : 0.3,
    },
    limitingFactors,
  }
}

function buildConstraints(input: { today: string; state: CurrentState; races: Race[]; freshness: FreshnessReport; evidenceIds: string[] }): Constraint[] {
  const { today, state, races, freshness, evidenceIds } = input
  const constraints: Constraint[] = []
  if (state.injury_present) {
    constraints.push({ id: `health:injury:${today}`, type: 'health', severity: 'hard', validFrom: today, reason: 'Injury is present; training/racing must be blocked until cleared.', evidenceIds })
  }
  if (state.illness_present) {
    constraints.push({ id: `health:illness:${today}`, type: 'health', severity: 'hard', validFrom: today, reason: 'Illness is present; training/racing must be blocked until cleared.', evidenceIds })
  }
  if (state.recovery_status === 'red' && !state.injury_present && !state.illness_present) {
    constraints.push({ id: `recovery:red:${today}`, type: 'recovery', severity: 'soft', validFrom: today, reason: 'Recovery is red; reduce load and protect the next key session.', evidenceIds })
  }
  for (const race of races) {
    const date = isoDate(race.date)
    if (!date) continue
    const days = daysBetween(today, date)
    if (race.mandatory && days >= 0 && days <= 3) {
      constraints.push({ id: `calendar:fixed-race:${race.id}`, type: 'calendar', severity: 'hard', validFrom: today, validUntil: date, reason: `Fixed race remains in the model: ${race.name}.`, evidenceIds: [`race:${race.id}`] })
    }
  }
  for (const source of freshness.staleSources) {
    constraints.push({ id: `freshness:${source}:${today}`, type: 'athlete-rule', severity: 'advisory', validFrom: today, reason: `${source} data is stale or missing; reduce decision confidence, do not delete data.`, evidenceIds })
  }
  return constraints
}

function missingSignals(state: CurrentState): string[] {
  return [
    state.hrv_14d_avg == null && state.garmin_hrv_status == null ? 'HRV' : undefined,
    state.sleep_hours_14d_avg == null && state.garmin_sleep_score == null ? 'sleep' : undefined,
    state.resting_hr_14d_avg == null ? 'resting HR' : undefined,
    state.recovery_score == null && state.garmin_training_readiness == null ? 'recovery score' : undefined,
  ].filter((signal): signal is string => Boolean(signal))
}

function dominantSignals(state: CurrentState): string[] {
  return [
    `recovery ${state.recovery_status}`,
    state.recovery_score != null ? `recovery score ${state.recovery_score}` : undefined,
    state.garmin_training_readiness != null ? `Garmin readiness ${state.garmin_training_readiness}` : undefined,
    state.hrv_trend ? `HRV trend ${state.hrv_trend}` : undefined,
  ].filter((signal): signal is string => Boolean(signal))
}

export function buildCanonicalAthleteState(input: {
  athleteId: string
  today: string
  generatedAt: string
  state: CurrentState
  activities: Activity[]
  races: Race[]
  goals: Goal[]
  freshness: FreshnessReport
  evidence: EvidenceRecord[]
}): CanonicalAthleteState {
  const { athleteId, today, generatedAt, state, activities, races, goals, freshness, evidence } = input
  const evidenceIds = evidence.map((record) => record.id)
  const warnings = freshness.signals.filter((signal) => signal.status !== 'fresh').map((signal) => signal.message)
  const currentStateFreshness = freshness.signals.find((signal) => signal.source === 'current-state')?.status
  const activityFreshness = freshness.signals.find((signal) => signal.source === 'activities')?.status
  const load7 = recentLoad(activities, today, 7)
  const load42 = recentLoad(activities, today, 42)
  const acuteLoad = load7
  const chronicLoad = load42 === undefined ? undefined : Math.round(load42 / 6)
  const loadBalance = acuteLoad !== undefined && chronicLoad ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : undefined
  const completion = completionRate(activities, today)
  const missing = missingSignals(state)
  const activeGoal = buildActiveGoal(goals[0], today, activities, state, evidenceIds)

  return {
    athleteId,
    generatedAt,
    stateVersion: CANONICAL_ATHLETE_STATE_VERSION,
    identity: {
      bodyMassKg: state.body_weight_kg ?? undefined,
    },
    freshness: {
      activitiesUpdatedAt: freshnessDate(freshness, 'activities'),
      recoveryUpdatedAt: freshnessDate(freshness, 'current-state'),
      wellnessUpdatedAt: freshnessDate(freshness, 'current-state'),
      calendarUpdatedAt: freshnessDate(freshness, 'races'),
      overall: freshnessOverall(freshness.overall),
    },
    recovery: {
      status: recoveryStatus(state),
      score: state.recovery_score ?? state.garmin_training_readiness ?? undefined,
      confidence: confidence(currentStateFreshness, missing.length ? 0.72 : 1),
      dominantSignals: dominantSignals(state),
      missingSignals: missing,
    },
    fatigue: {
      acuteLoad,
      chronicLoad,
      loadBalance,
      metabolic: state.latest_race_cost ?? undefined,
      confidence: confidence(activityFreshness, acuteLoad === undefined ? 0.45 : 0.8),
    },
    fitness: {
      aerobicCapacity: state.vo2max ?? undefined,
      thresholdCapacity: state.eftp_watts ?? undefined,
      endurance: longestRunKm(activities, today, 70),
      durability: longestRunKm(activities, today, 70),
      confidence: confidence(activityFreshness, activities.length >= 3 ? 0.62 : 0.35),
    },
    health: {
      injuryStatus: healthStatus(state.injury_present),
      illnessStatus: healthStatus(state.illness_present),
      notes: state.injury_present || state.illness_present ? ['Health block active.'] : [],
    },
    behaviour: {
      completionRate: completion,
      complianceRate: completion,
      confidence: completion === undefined ? 0.25 : 0.45,
    },
    availability: {
      blockedDates: [],
    },
    activeGoal,
    upcomingConstraints: buildConstraints({ today, state, races, freshness, evidenceIds }),
    evidenceSummary: {
      includedEvidenceIds: evidenceIds,
      excludedEvidenceIds: [],
      warnings,
    },
  }
}
