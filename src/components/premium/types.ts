import type { ComponentType } from 'react'
import type { AccountSettings, Activity, CurrentState, DailyDecision, DecisionLogEntry, Goal, GoalConversationEntry, Race, VisualizationSettings, WorkoutRecommendation } from '../../domain/types'
import type { CoachBriefing } from '../../engine/coachBriefingEngine'
import type { DailyRecommendation } from '../../engine/dailyRecommendationEngine'
import type { GoalReadinessResult } from '../../engine/goalReadinessEngine'
import type { MorningReadinessVerdict } from '../../engine/morningReadinessEngine'
import type { PathToGoal } from '../../engine/pathEngine'
import type { Next72Plan } from '../../engine/recoveryPlanEngine'
import type { DashboardStats } from '../../engine/statsEngine'
import type { LearningEngineOutput } from '../../engine/learningEngine'
import type { TrajectoryEngineOutput } from '../../engine/trajectoryEngine'
import type { SyncStatus } from '../../lib/dataSync'
import type { IntegrationHealth } from '../../data/integrationHealth'

export type PremiumCommandDeckProps = {
  today: string
  decision: DailyDecision
  recommendation: WorkoutRecommendation
  briefing: CoachBriefing
  dailyRecommendation: DailyRecommendation
  morningReadiness: MorningReadinessVerdict
  next72Plan: Next72Plan
  stats: DashboardStats
  activities: Activity[]
  decisionLog: DecisionLogEntry[]
  races: Race[]
  goals: Goal[]
  activeGoal?: Goal
  goalConversation: GoalConversationEntry[]
  state: CurrentState
  account: AccountSettings
  visualization: VisualizationSettings
  readiness?: GoalReadinessResult
  trajectory: TrajectoryEngineOutput
  learning: LearningEngineOutput
  syncStatus: SyncStatus
  integrations: IntegrationHealth[]
  path?: PathToGoal
  onSelectGoal: (goalId: string) => void
  onAddGoal: (goal: Goal) => void
  onDeleteGoal: (goalId: string) => void
  onAddRace: (race: Race) => void
  onAddGoalConversation: (entry: GoalConversationEntry) => void
  onDeleteGoalConversation: (entryId: string) => void
  onUpdateAccount: (account: AccountSettings) => void
  onUpdateVisualization: (visualization: VisualizationSettings) => void
  onSyncIntervals: () => Promise<DataHubActionResult>
  onImportGarminRecovery: (file: File) => Promise<DataHubActionResult>
  onImportStravaActivities: (file: File) => Promise<DataHubActionResult>
  onExportLocalData: () => void
  onImportLocalData: (file: File) => Promise<void>
  onAddActivities: (activities: Activity[]) => void
}

export type DataHubActionResult = {
  source: string
  records: number
  latestDate?: string
  message: string
}

export type ScreenId = 'home' | 'history' | 'performance' | 'races' | 'training' | 'recovery' | 'goals' | 'coach' | 'settings'
export type NavItem = { id: ScreenId; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }
