import defaultActivities from '../../../../data/activities.json'
import defaultRaces from '../../../../data/races.json'
import defaultState from '../../../../data/current-state.json'
import defaultGoals from '../../../../data/goals.json'
import type { Activity, CurrentState, DecisionLogEntry, Goal, Race } from '../../../domain/types'
import { buildIntegrationHealth } from '../../../data/integrationHealth'
import { buildActualOverride } from '../../../engine/actualOverrideEngine'
import { buildCoachBriefing } from '../../../engine/coachBriefingEngine'
import { makeDailyDecision } from '../../../engine/decisionEngine'
import { evaluateGoalReadiness } from '../../../engine/goalReadinessEngine'
import { buildMorningReadinessVerdict } from '../../../engine/morningReadinessEngine'
import { buildPathToGoal } from '../../../engine/pathEngine'
import { buildNext72hPlan } from '../../../engine/recoveryPlanEngine'
import { buildDashboardStats } from '../../../engine/statsEngine'
import { makeWorkoutRecommendation } from '../../../engine/workoutEngine'
import type { PremiumCommandDeckProps } from '../types'

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function buildPremiumScreenFixture(date = '2026-05-18'): PremiumCommandDeckProps {
  const today = date
  const activities = defaultActivities as Activity[]
  const races = defaultRaces as Race[]
  const state = defaultState as CurrentState
  const goals = defaultGoals as Goal[]
  const decisionLog: DecisionLogEntry[] = []
  const decision = makeDailyDecision({ today, races, activities, state })
  const recommendation = makeWorkoutRecommendation({ decision, state })
  const actualOverride = buildActualOverride({ today, activities, decisionLog, recommendation })
  const yesterdayOverride = buildActualOverride({ today: addDays(today, -1), activities, decisionLog, recommendation })
  const morningReadiness = buildMorningReadinessVerdict({ today, state, yesterdayOverride })
  const next72Plan = buildNext72hPlan({ decision, state, actualOverride, morningReadiness })
  const stats = buildDashboardStats({ today, races, activities })
  const syncStatus = { state: 'fresh' as const, message: 'Fixture sync ready.', activityCount: activities.length, raceCount: races.length, lastSyncedAt: `${today}T06:00:00.000Z` }
  const integrations = buildIntegrationHealth({ activities, state, syncStatus })
  const activeGoal = goals[0]
  const readiness = activeGoal ? evaluateGoalReadiness({ goal: activeGoal, today, activities, races, state }) : undefined
  const path = activeGoal && readiness ? buildPathToGoal({ goal: activeGoal, today, readinessScore: readiness.overallReadiness, state, activities, races }) : undefined
  const briefing = buildCoachBriefing({ decision, recommendation, state, next72Plan, readiness, morningReadiness })

  return {
    today,
    decision,
    recommendation,
    briefing,
    morningReadiness,
    next72Plan,
    stats,
    activities,
    decisionLog,
    races,
    goals,
    activeGoal,
    goalConversation: [],
    state,
    account: { status: 'local', displayName: 'Dennis', localOnly: true },
    visualization: { performanceFocus: 'all', visibleFields: { load: ['ctl', 'atl', 'tsb'], 'race-cost': ['value'], recovery: ['drift', 'durability'], goal: ['readiness'], 'recovery-signals': ['signals'], 'recovery-lag': ['lag', 'risk'], races: ['stages', 'cumulative'], history: ['load', 'distanceKm', 'durationMin', 'avgHr'], 'health-history': ['hr', 'hrv', 'sleep', 'vo2max', 'steps', 'readiness', 'recoveryTime'] } },
    readiness,
    syncStatus,
    integrations,
    path,
    onSelectGoal: () => undefined,
    onAddGoal: () => undefined,
    onAddRace: () => undefined,
    onAddGoalConversation: () => undefined,
    onDeleteGoalConversation: () => undefined,
    onUpdateAccount: () => undefined,
    onUpdateVisualization: () => undefined,
    onSyncIntervals: async () => ({ source: 'Intervals', records: 0, message: 'Fixture sync ready.' }),
    onImportGarminRecovery: async () => ({ source: 'Garmin', records: 1, latestDate: today, message: 'Fixture Garmin import ready.' }),
    onImportStravaActivities: async () => ({ source: 'Strava', records: 1, latestDate: today, message: 'Fixture Strava import ready.' }),
    onExportLocalData: () => undefined,
    onImportLocalData: async () => undefined,
    onAddActivities: () => undefined,
  }
}
