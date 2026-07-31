import { useMemo } from 'react'
import type { Activity, CurrentState, DecisionLogEntry, Goal, Race } from '../domain/types'
import { buildEvidenceRecords } from '../data/evidence'
import { buildIntegrationHealth } from '../data/integrationHealth'
import { buildFreshnessReport } from '../data/freshness'
import { buildActualOverride } from '../engine/actualOverrideEngine'
import { buildCoachBriefing } from '../engine/coachBriefingEngine'
import { buildCoachActionLoop } from '../engine/coachActionLoopEngine'
import { makeDailyDecision } from '../engine/decisionEngine'
import { evaluateGoalReadiness } from '../engine/goalReadinessEngine'
import { buildPathToGoal } from '../engine/pathEngine'
import { getLatestRaceCost } from '../engine/raceCostEngine'
import { buildNext72hPlan } from '../engine/recoveryPlanEngine'
import { buildMorningReadinessVerdict } from '../engine/morningReadinessEngine'
import { buildScenarioSimulation } from '../engine/scenarioSimulationEngine'
import { buildDashboardStats } from '../engine/statsEngine'
import { buildOperationalTimeline } from '../engine/timelineEngine'
import { makeWorkoutRecommendation } from '../engine/workoutEngine'
import type { SyncStatus } from '../lib/dataSync'
import { buildCanonicalAthleteState } from '../state/canonicalAthleteState'

type UseAerionDerivedStateInput = {
  today: string
  yesterday: string
  races: Race[]
  goals: Goal[]
  activeGoalId?: string
  activities: Activity[]
  decisionLog: DecisionLogEntry[]
  state: CurrentState
  syncStatus: SyncStatus
}

export function useAerionDerivedState({
  today,
  yesterday,
  races,
  goals,
  activeGoalId,
  activities,
  decisionLog,
  state,
  syncStatus,
}: UseAerionDerivedStateInput) {
  const decision = useMemo(() => makeDailyDecision({ today, races, activities, state }), [today, races, activities, state])
  const latestCost = useMemo(() => getLatestRaceCost(activities), [activities])
  const recommendation = useMemo(() => makeWorkoutRecommendation({ decision, state }), [decision, state])
  const scenarioSimulation = useMemo(() => buildScenarioSimulation({ decision, state }), [decision, state])
  const coachActionLoop = useMemo(() => buildCoachActionLoop({ today, decisionLog, simulation: scenarioSimulation, state }), [today, decisionLog, scenarioSimulation, state])
  const actualOverride = useMemo(() => buildActualOverride({ today, activities, decisionLog, recommendation }), [today, activities, decisionLog, recommendation])
  const yesterdayOverride = useMemo(() => buildActualOverride({ today: yesterday, activities, decisionLog, recommendation }), [yesterday, activities, decisionLog, recommendation])
  const freshness = useMemo(() => buildFreshnessReport({ today, state, activities, races, syncedAt: syncStatus.lastSyncedAt }), [today, state, activities, races, syncStatus.lastSyncedAt])
  const evidence = useMemo(() => buildEvidenceRecords({ athleteId: 'dennis-local', generatedAt: syncStatus.lastSyncedAt ?? new Date().toISOString(), activities, state, races, goals, freshness }), [activities, state, races, goals, freshness, syncStatus.lastSyncedAt])
  const athleteState = useMemo(() => buildCanonicalAthleteState({ athleteId: 'dennis-local', today, generatedAt: syncStatus.lastSyncedAt ?? new Date().toISOString(), state, activities, races, goals, freshness, evidence }), [today, state, activities, races, goals, freshness, evidence, syncStatus.lastSyncedAt])
  const morningReadiness = useMemo(() => buildMorningReadinessVerdict({ today, state, yesterdayOverride, athleteState }), [today, state, yesterdayOverride, athleteState])
  const next72Plan = useMemo(() => buildNext72hPlan({ decision, state, actualOverride, morningReadiness, athleteState }), [decision, state, actualOverride, morningReadiness, athleteState])
  const stats = useMemo(() => buildDashboardStats({ today, races, activities }), [today, races, activities])
  const timeline = useMemo(() => buildOperationalTimeline({ today, races, activities, decisions: decisionLog }), [today, races, activities, decisionLog])
  const integrations = useMemo(() => buildIntegrationHealth({ activities, state, syncStatus, freshness }), [activities, state, syncStatus, freshness])
  const activeGoal = useMemo(() => goals.find((goal) => goal.id === activeGoalId) ?? goals[0], [activeGoalId, goals])
  const goalReadiness = useMemo(() => activeGoal ? evaluateGoalReadiness({ goal: activeGoal, today, activities, races, state }) : undefined, [activeGoal, today, activities, races, state])
  const pathToGoal = useMemo(() => activeGoal && goalReadiness ? buildPathToGoal({ goal: activeGoal, today, readinessScore: goalReadiness.overallReadiness, state, activities, races }) : undefined, [activeGoal, goalReadiness, today, state, activities, races])
  const coachBriefing = useMemo(() => buildCoachBriefing({ decision, recommendation, state, next72Plan, readiness: goalReadiness, morningReadiness }), [decision, recommendation, state, next72Plan, goalReadiness, morningReadiness])
  const nextRace = decision.nextRace
  const nextRaceDetail = nextRace
    ? `${nextRace.date} · ${nextRace.distanceKm ?? 'TBD'} km · ${nextRace.elevationM ?? 'TBD'} m · Class ${nextRace.class ?? 'TBD'}`
    : 'No future race loaded'
  const statusTone: 'red' | 'yellow' | 'purple' | 'green' = decision.status === 'Red' ? 'red' : decision.status === 'Yellow' ? 'yellow' : decision.status === 'InjuryIllness' ? 'purple' : 'green'
  const selectedScenarioId = coachActionLoop.selectedScenario?.id

  return {
    decision,
    latestCost,
    recommendation,
    scenarioSimulation,
    coachActionLoop,
    actualOverride,
    morningReadiness,
    next72Plan,
    selectedScenarioId,
    stats,
    timeline,
    freshness,
    evidence,
    athleteState,
    integrations,
    activeGoal,
    goalReadiness,
    pathToGoal,
    coachBriefing,
    nextRace,
    nextRaceDetail,
    statusTone,
  }
}
