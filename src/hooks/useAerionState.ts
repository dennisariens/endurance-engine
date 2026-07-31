import { useEffect, useState } from 'react'
import defaultActivities from '../../data/activities.json'
import defaultBlockedDates from '../../data/blocked-dates.json'
import defaultState from '../../data/current-state.json'
import defaultGoals from '../../data/goals.json'
import defaultRaces from '../../data/races.json'
import type { AccountSettings, Activity, BlockedDate, CurrentState, DecisionLogEntry, Goal, GoalConversationEntry, Race, Theme, VisualizationSettings } from '../domain/types'
import { loadLocal, saveLocal } from '../lib/storage'

export const defaultAccount: AccountSettings = { status: 'local', displayName: 'Dennis', localOnly: true }
export const defaultVisualization: VisualizationSettings = {
  performanceFocus: 'all',
  visibleFields: {
    load: ['ctl', 'atl', 'tsb'],
    'race-cost': ['value'],
    recovery: ['drift', 'durability'],
    goal: ['readiness'],
    'recovery-signals': ['signals'],
    'recovery-lag': ['lag', 'risk'],
    races: ['stages', 'cumulative'],
    history: ['load', 'distanceKm', 'durationMin', 'avgHr'],
    'health-history': ['hr', 'hrv', 'sleep', 'vo2max', 'steps', 'readiness', 'recoveryTime'],
  },
}

export type AerionStateSnapshot = {
  races: Race[]
  goals: Goal[]
  goalConversation?: GoalConversationEntry[]
  activities: Activity[]
  blockedDates: BlockedDate[]
  decisionLog: DecisionLogEntry[]
  currentState: CurrentState
  theme: Theme
  account?: AccountSettings
  visualization?: VisualizationSettings
}

export function useAerionState() {
  const [races, setRaces] = useState<Race[]>(() => loadLocal('aerion:races', defaultRaces as Race[]))
  const [goals, setGoals] = useState<Goal[]>(() => loadLocal('aerion:goals', defaultGoals as Goal[]))
  const [goalConversation, setGoalConversation] = useState<GoalConversationEntry[]>(() => loadLocal('aerion:goal-conversation', [] as GoalConversationEntry[]))
  const [activeGoalId, setActiveGoalId] = useState<string | undefined>(() => loadLocal('aerion:active-goal-id', (defaultGoals as Goal[])[0]?.id))
  const [activities, setActivities] = useState<Activity[]>(() => loadLocal('aerion:activities', defaultActivities as Activity[]))
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => loadLocal('aerion:blocked', defaultBlockedDates as BlockedDate[]))
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>(() => loadLocal('aerion:decision-log', [] as DecisionLogEntry[]))
  const [theme, setTheme] = useState<Theme>(() => loadLocal('aerion:theme', 'dark' as Theme))
  const [account, setAccount] = useState<AccountSettings>(() => loadLocal('aerion:account', defaultAccount))
  const [visualization, setVisualization] = useState<VisualizationSettings>(() => loadLocal('aerion:visualization', defaultVisualization))
  const [state, setState] = useState<CurrentState>(() => loadLocal('aerion:current-state', defaultState as CurrentState))

  useEffect(() => saveLocal('aerion:races', races), [races])
  useEffect(() => saveLocal('aerion:goals', goals), [goals])
  useEffect(() => saveLocal('aerion:goal-conversation', goalConversation), [goalConversation])
  useEffect(() => saveLocal('aerion:active-goal-id', activeGoalId), [activeGoalId])
  useEffect(() => saveLocal('aerion:activities', activities), [activities])
  useEffect(() => saveLocal('aerion:blocked', blockedDates), [blockedDates])
  useEffect(() => saveLocal('aerion:decision-log', decisionLog), [decisionLog])
  useEffect(() => saveLocal('aerion:current-state', state), [state])
  useEffect(() => saveLocal('aerion:theme', theme), [theme])
  useEffect(() => saveLocal('aerion:account', account), [account])
  useEffect(() => saveLocal('aerion:visualization', visualization), [visualization])

  useEffect(() => {
    if (!goals.length) {
      setActiveGoalId(undefined)
      return
    }
    if (!activeGoalId || !goals.some((goal) => goal.id === activeGoalId)) setActiveGoalId(goals[0].id)
  }, [activeGoalId, goals])

  const importSnapshot = (snapshot: AerionStateSnapshot) => {
    setRaces(snapshot.races)
    setGoals(snapshot.goals)
    setGoalConversation(snapshot.goalConversation ?? [])
    setActiveGoalId(snapshot.goals[0]?.id)
    setActivities(snapshot.activities)
    setBlockedDates(snapshot.blockedDates)
    setDecisionLog(snapshot.decisionLog)
    setState(snapshot.currentState)
    setTheme(snapshot.theme)
    setAccount(snapshot.account ?? defaultAccount)
    setVisualization(snapshot.visualization ?? defaultVisualization)
  }

  const resetLocalData = () => {
    setRaces(defaultRaces as Race[])
    setGoals(defaultGoals as Goal[])
    setGoalConversation([])
    setActiveGoalId((defaultGoals as Goal[])[0]?.id)
    setActivities(defaultActivities as Activity[])
    setBlockedDates(defaultBlockedDates as BlockedDate[])
    setDecisionLog([])
    setState(defaultState as CurrentState)
    setTheme('dark')
    setAccount(defaultAccount)
    setVisualization(defaultVisualization)
  }

  return {
    races,
    setRaces,
    goals,
    setGoals,
    goalConversation,
    setGoalConversation,
    activeGoalId,
    setActiveGoalId,
    activities,
    setActivities,
    blockedDates,
    setBlockedDates,
    decisionLog,
    setDecisionLog,
    theme,
    setTheme,
    account,
    setAccount,
    visualization,
    setVisualization,
    state,
    setState,
    importSnapshot,
    resetLocalData,
  }
}
