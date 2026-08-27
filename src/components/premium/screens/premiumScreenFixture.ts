import defaultActivities from '../../../../data/activities.json'
import defaultRaces from '../../../../data/races.json'
import defaultState from '../../../../data/current-state.json'
import defaultGoals from '../../../../data/goals.json'
import type { Activity, CurrentState, DecisionLogEntry, Goal, Race } from '../../../domain/types'
import { buildEvidenceRecords } from '../../../data/evidence'
import { buildFreshnessReport } from '../../../data/freshness'
import { buildIntegrationHealth } from '../../../data/integrationHealth'
import { buildCanonicalAthleteState } from '../../../state/canonicalAthleteState'
import { buildActualOverride } from '../../../engine/actualOverrideEngine'
import { buildCoachBriefing } from '../../../engine/coachBriefingEngine'
import { makeDailyDecision } from '../../../engine/decisionEngine'
import { buildDailyRecommendation } from '../../../engine/dailyRecommendationEngine'
import { evaluateGoalReadiness } from '../../../engine/goalReadinessEngine'
import { buildLearningEngine } from '../../../engine/learningEngine'
import { buildMarathonBlock } from '../../../engine/marathonBlockEngine'
import { buildMorningReadinessVerdict } from '../../../engine/morningReadinessEngine'
import { buildPathToGoal } from '../../../engine/pathEngine'
import { buildNext72hPlan } from '../../../engine/recoveryPlanEngine'
import { buildDashboardStats } from '../../../engine/statsEngine'
import { buildTrajectory } from '../../../engine/trajectoryEngine'
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
  const freshness = buildFreshnessReport({ today, state, activities, races, syncedAt: `${today}T06:00:00.000Z` })
  const evidence = buildEvidenceRecords({ athleteId: 'dennis-fixture', generatedAt: `${today}T06:00:00.000Z`, state, activities, races, goals, freshness })
  const athleteState = buildCanonicalAthleteState({ athleteId: 'dennis-fixture', today, generatedAt: `${today}T06:00:00.000Z`, state, activities, races, goals, freshness, evidence })
  const morningReadiness = buildMorningReadinessVerdict({ today, state, yesterdayOverride, athleteState })
  const next72Plan = buildNext72hPlan({ decision, state, actualOverride, morningReadiness, athleteState })
  const stats = buildDashboardStats({ today, races, activities })
  const syncStatus = { state: 'fresh' as const, message: 'Fixture sync ready.', activityCount: activities.length, raceCount: races.length, lastSyncedAt: `${today}T06:00:00.000Z` }
  const integrations = buildIntegrationHealth({ activities, state, syncStatus })
  const activeGoal = goals[0]
  const readiness = activeGoal ? evaluateGoalReadiness({ goal: activeGoal, today, activities, races, state }) : undefined
  const path = activeGoal && readiness ? buildPathToGoal({ goal: activeGoal, today, readinessScore: readiness.overallReadiness, state, activities, races }) : undefined
  const trajectory = buildTrajectory({ athleteState, decision, next72Plan, goalReadiness: readiness })
  const learning = buildLearningEngine({ today, activities, decisions: decisionLog, athleteState, trajectory })
  const marathonBlock = buildMarathonBlock({ today, activeGoal, goals, races, activities, state })
  const briefing = buildCoachBriefing({ decision, recommendation, state, next72Plan, readiness, morningReadiness, athleteState })
  const dailyRecommendation = buildDailyRecommendation({ recommendation, briefing, morningReadiness, next72Plan, activeGoal, readiness, path, trajectory, learning, marathonBlock, nextRace: decision.nextRace, recoveryMissing: integrations.some((integration) => integration.id === 'garmin' && integration.state !== 'connected'), activityProofSparse: activities.filter((activity) => activity.source === 'strava').length === 0 })

  return {
    today,
    decision,
    recommendation,
    briefing,
    dailyRecommendation,
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
    trajectory,
    learning,
    marathonBlock,
    syncStatus,
    integrations,
    path,
    onSelectGoal: () => undefined,
    onAddGoal: () => undefined,
    onDeleteGoal: () => undefined,
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
