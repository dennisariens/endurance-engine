import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import defaultActivities from '../data/activities.json'
import defaultBlockedDates from '../data/blocked-dates.json'
import defaultState from '../data/current-state.json'
import defaultGoals from '../data/goals.json'
import defaultRaces from '../data/races.json'
import { ActivityPanel } from './components/ActivityPanel'
import { BaselineZonesPanel } from './components/BaselineZonesPanel'
import { CalendarPanel } from './components/CalendarPanel'
import { CostReadinessPanel } from './components/CostReadinessPanel'
import { DataControlsPanel, type AerionLocalSnapshot } from './components/DataControlsPanel'
import { DecisionHistoryPanel } from './components/DecisionHistoryPanel'
import { EventForms } from './components/EventForms'
import { GoalControlPanel } from './components/GoalControlPanel'
import { LegendPanel } from './components/LegendPanel'
import { MethodologyPanel } from './components/MethodologyPanel'
import { MetricCard } from './components/MetricCard'
import { Next72PlanPanel } from './components/Next72PlanPanel'
import { OperationalLogPanel } from './components/OperationalLogPanel'
import { PathToGoalPanel } from './components/PathToGoalPanel'
import { StatsPanel } from './components/StatsPanel'
import { SyncStatusPanel } from './components/SyncStatusPanel'
import { TodayPlanPanel } from './components/TodayPlanPanel'
import { WorkoutPanel } from './components/WorkoutPanel'
import type { Activity, BlockedDate, CurrentState, DecisionLogAction, DecisionLogEntry, Goal, Race, Theme } from './domain/types'
import { daysBetween } from './engine/calendarEngine'
import { makeDailyDecision } from './engine/decisionEngine'
import { evaluateGoalReadiness } from './engine/goalReadinessEngine'
import { buildPathToGoal } from './engine/pathEngine'
import { getLatestRaceCost } from './engine/raceCostEngine'
import { buildNext72hPlan } from './engine/recoveryPlanEngine'
import { buildDashboardStats } from './engine/statsEngine'
import { buildOperationalTimeline, getLocalIsoDate, mergeActivitiesById, mergeRacesById } from './engine/timelineEngine'
import { makeWorkoutRecommendation } from './engine/workoutEngine'
import { fetchOpeningSync, type SyncStatus } from './lib/dataSync'
import { loadLocal, saveLocal } from './lib/storage'

const today = getLocalIsoDate()
const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()
const yesterdayActual: Activity = {
  id: 'manual-20260430-sort-like-activity',
  source: 'manual',
  date: '2026-04-30',
  name: 'Sort-like activity',
  type: 'Ride',
}

function withKnownActuals(activities: Activity[]): Activity[] {
  if (activities.some((activity) => activity.id === yesterdayActual.id || (activity.date === yesterdayActual.date && activity.name.toLowerCase().includes('sort')))) return activities
  return [yesterdayActual, ...activities]
}

export default function App() {
  const [races, setRaces] = useState<Race[]>(() => loadLocal('aerion:races', defaultRaces as Race[]))
  const [goals, setGoals] = useState<Goal[]>(() => loadLocal('aerion:goals', defaultGoals as Goal[]))
  const [activeGoalId, setActiveGoalId] = useState<string | undefined>(() => loadLocal('aerion:active-goal-id', (defaultGoals as Goal[])[0]?.id))
  const [activities, setActivities] = useState<Activity[]>(() => withKnownActuals(loadLocal('aerion:activities', defaultActivities as Activity[])))
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => loadLocal('aerion:blocked', defaultBlockedDates as BlockedDate[]))
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>(() => loadLocal('aerion:decision-log', [] as DecisionLogEntry[]))
  const [theme, setTheme] = useState<Theme>(() => loadLocal('aerion:theme', 'dark' as Theme))
  const [state, setState] = useState<CurrentState>(() => loadLocal('aerion:current-state', defaultState as CurrentState))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle', message: 'Opening sync not started yet.' })

  useEffect(() => saveLocal('aerion:races', races), [races])
  useEffect(() => saveLocal('aerion:goals', goals), [goals])
  useEffect(() => saveLocal('aerion:active-goal-id', activeGoalId), [activeGoalId])
  useEffect(() => saveLocal('aerion:activities', activities), [activities])
  useEffect(() => saveLocal('aerion:blocked', blockedDates), [blockedDates])
  useEffect(() => saveLocal('aerion:decision-log', decisionLog), [decisionLog])
  useEffect(() => saveLocal('aerion:current-state', state), [state])
  useEffect(() => saveLocal('aerion:theme', theme), [theme])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!goals.length) {
      setActiveGoalId(undefined)
      return
    }
    if (!activeGoalId || !goals.some((goal) => goal.id === activeGoalId)) setActiveGoalId(goals[0].id)
  }, [activeGoalId, goals])

  useEffect(() => {
    let cancelled = false
    setSyncStatus({ state: 'syncing', message: 'Checking Intervals.icu through the local dev server.' })
    fetchOpeningSync()
      .then((payload) => {
        if (cancelled) return
        if (payload.ok && payload.activities) {
          setActivities((current) => withKnownActuals(mergeActivitiesById({ current, incoming: payload.activities ?? [] })))
          if (payload.races?.length) setRaces((current) => mergeRacesById({ current, incoming: payload.races ?? [] }))
          if (payload.state) setState((current) => ({ ...current, ...payload.state }))
          setSyncStatus({ state: 'fresh', message: payload.message, lastSyncedAt: payload.syncedAt, activityCount: payload.activities.length, raceCount: payload.races?.length ?? 0 })
          return
        }
        setSyncStatus({ state: payload.source === 'unavailable' ? 'offline' : 'error', message: payload.message, lastSyncedAt: payload.syncedAt })
      })
      .catch((error) => {
        if (!cancelled) setSyncStatus({ state: 'offline', message: `No opening sync available: ${error instanceof Error ? error.message : 'unknown error'}` })
      })
    return () => { cancelled = true }
  }, [])

  const decision = useMemo(() => makeDailyDecision({ today, races, activities, state }), [races, activities, state])
  const latestCost = useMemo(() => getLatestRaceCost(activities), [activities])
  const recommendation = useMemo(() => makeWorkoutRecommendation({ decision, state }), [decision, state])
  const next72Plan = useMemo(() => buildNext72hPlan({ decision, state }), [decision, state])
  const stats = useMemo(() => buildDashboardStats({ today, races, activities }), [races, activities])
  const timeline = useMemo(() => buildOperationalTimeline({ today, races, activities, decisions: decisionLog }), [races, activities, decisionLog])
  const activeGoal = useMemo(() => goals.find((goal) => goal.id === activeGoalId) ?? goals[0], [activeGoalId, goals])
  const goalReadiness = useMemo(() => activeGoal ? evaluateGoalReadiness({ goal: activeGoal, today, activities, races, state }) : undefined, [activeGoal, activities, races, state])
  const pathToGoal = useMemo(() => activeGoal && goalReadiness ? buildPathToGoal({ goal: activeGoal, today, readinessScore: goalReadiness.overallReadiness, state, activities, races }) : undefined, [activeGoal, goalReadiness, state, activities, races])
  const nextRace = decision.nextRace
  const nextRaceDetail = nextRace
    ? `${nextRace.date} · ${nextRace.distanceKm ?? 'TBD'} km · ${nextRace.elevationM ?? 'TBD'} m · Class ${nextRace.class ?? 'TBD'}`
    : 'No future race loaded'

  const statusTone = decision.status === 'Red' ? 'red' : decision.status === 'Yellow' ? 'yellow' : decision.status === 'InjuryIllness' ? 'purple' : 'green'
  const latestDecisionAction = decisionLog.find((entry) => entry.date === today)?.action
  const logDecision = (action: DecisionLogAction, note?: string) => {
    const entry: DecisionLogEntry = {
      id: crypto.randomUUID(),
      date: today,
      loggedAt: new Date().toISOString(),
      action,
      mode: decision.mode,
      status: decision.status,
      workoutTitle: action === 'rested' ? 'Full rest' : recommendation.primary.title,
      durationMin: action === 'rested' ? 0 : recommendation.primary.durationMin,
      hrCap: action === 'rested' ? undefined : recommendation.primary.hrCap,
      powerCap: action === 'rested' ? undefined : recommendation.primary.powerCap,
      reason: decision.reasons.slice(0, 2).join(' · '),
      note,
      nextRaceName: nextRace?.name,
    }
    setDecisionLog((items) => [entry, ...items.filter((item) => item.date !== today)])
  }

  const importSnapshot = (snapshot: AerionLocalSnapshot) => {
    setRaces(snapshot.races)
    setGoals(snapshot.goals)
    setActiveGoalId(snapshot.goals[0]?.id)
    setActivities(withKnownActuals(snapshot.activities))
    setBlockedDates(snapshot.blockedDates)
    setDecisionLog(snapshot.decisionLog)
    setState(snapshot.currentState)
    setTheme(snapshot.theme)
  }

  const resetLocalData = () => {
    setRaces(defaultRaces as Race[])
    setGoals(defaultGoals as Goal[])
    setActiveGoalId((defaultGoals as Goal[])[0]?.id)
    setActivities(withKnownActuals(defaultActivities as Activity[]))
    setBlockedDates(defaultBlockedDates as BlockedDate[])
    setDecisionLog([])
    setState(defaultState as CurrentState)
    setTheme('dark')
  }

  return (
    <main className="app">
      <section className="hero topbar">
        <div>
          <p className="eyebrow">AERION · local MVP</p>
          <h1>Fixed-race endurance control</h1>
          <p>Race calendar first. Recovery consequences visible. Actual work beats button clicks.</p>
        </div>
        <button className="theme-toggle icon-button" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </section>

      <SyncStatusPanel status={syncStatus} today={today} />

      <section className="grid metrics-grid">
        <MetricCard label="Today" value={formatLabel(decision.mode)} detail={decision.reasons[0]} tone={statusTone} tooltip="Primary operating mode for today. Damage Control means protect freshness around a fixed race, not chase fitness today." />
        <MetricCard label="Next Race" value={nextRace?.name ?? 'None'} detail={nextRaceDetail} tone="blue" tooltip="The next fixed event driving the plan. Fixed races are not blocked unless injury or illness is present." />
        <MetricCard label="Latest Race Cost" value={`${latestCost.score} / ${latestCost.band}`} detail={latestCost.activity?.name ?? 'No race activity loaded'} tone={latestCost.band === 'Extreme' ? 'red' : latestCost.band === 'High' ? 'yellow' : 'green'} tooltip="Race cost estimates recovery burden on a 0–100 scale: low 0–39, medium 40–59, high 60–79, extreme 80+." />
        <MetricCard label="Recovery" value={`${state.recovery_status ?? 'unknown'}`.toUpperCase()} detail={`RHR ${state.resting_hr_14d_avg ?? 'n/a'} · HRV ${state.hrv_14d_avg ?? 'n/a'} · Sleep ${state.sleep_hours_14d_avg ?? 'n/a'}h`} tone={statusTone} tooltip="Recovery state combines available fatigue signals and latest race cost. RED means no intensity unless a fixed race forces damage control." />
        <MetricCard label="Workout" value={recommendation.primary.title} detail={`${recommendation.primary.durationMin || 'Off'} min · ${recommendation.primary.hrCap ? `HR ≤ ${recommendation.primary.hrCap} · Provisional zones` : recommendation.primary.intensity}`} tone="green" tooltip="Suggested work if you insist on doing something. HR caps are ceilings, not targets; zones are provisional until LTHR/AeT/drift tests exist." />
        <MetricCard label="Race Density" value={`${stats.racesNext7d} / 7d`} detail={`${stats.racesNext30d} races in next 30 days · ${stats.fixedRaceCount} fixed loaded`} tone={stats.racesNext7d > 2 ? 'red' : stats.racesNext7d > 1 ? 'yellow' : 'slate'} tooltip="Race density counts fixed events in upcoming windows. Higher density reduces safe training space and raises recovery risk." />
      </section>

      <section className="briefing panel">
        <div>
          <p className="eyebrow">Daily decision</p>
          <h2>{decision.today}: {formatLabel(decision.mode)}</h2>
        </div>
        <ul>
          {decision.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          <li>Race is blocked only if injury or illness is present.</li>
          {nextRace && <li>{daysBetween(today, nextRace.date)} day(s) until {nextRace.name}.</li>}
        </ul>
        <div className="switch-row">
          <span className={`pill ${decision.coreAllowed ? 'green' : 'slate'}`}>Core {decision.coreAllowed ? 'on' : 'off'}</span>
          <span className={`pill ${decision.strengthAllowed ? 'green' : 'slate'}`}>Strength {decision.strengthAllowed ? 'on' : 'off'}</span>
          <span className={`pill ${decision.fastingAllowed ? 'green' : 'slate'}`}>Fasting {decision.fastingAllowed ? 'on' : 'off'}</span>
          <span className={`pill ${decision.raceWeightAllowed ? 'green' : 'slate'}`}>Race-weight {decision.raceWeightAllowed ? 'on' : 'off'}</span>
        </div>
      </section>

      <TodayPlanPanel
        decision={decision}
        recommendation={recommendation}
        nextRaceName={nextRace?.name}
        latestAction={latestDecisionAction}
        onLogDecision={logDecision}
      />
      <Next72PlanPanel plan={next72Plan} />
      <PathToGoalPanel readiness={goalReadiness} path={pathToGoal} />
      <GoalControlPanel
        goals={goals}
        activeGoalId={activeGoal?.id}
        onSelectGoal={setActiveGoalId}
        onUpdateGoal={(goal) => setGoals((items) => items.map((item) => item.id === goal.id ? goal : item))}
        onDeleteGoal={(goalId) => setGoals((items) => items.filter((item) => item.id !== goalId))}
      />
      <CostReadinessPanel latestRaceActivity={latestCost.activity} state={state} />
      <OperationalLogPanel items={timeline} />
      <LegendPanel />
      <DecisionHistoryPanel entries={decisionLog} onClear={() => setDecisionLog([])} />
      <MethodologyPanel state={state} activityCount={activities.length} raceCount={races.length} />
      <BaselineZonesPanel />
      <WorkoutPanel recommendation={recommendation} />
      <StatsPanel stats={stats} />

      <div className="two-col">
        <CalendarPanel races={races} activities={activities} blockedDates={blockedDates} today={today} onDeleteRace={(id) => setRaces((items) => items.filter((item) => item.id !== id))} />
        <div className="stack">
          <EventForms
            onAddRace={(race) => setRaces((items) => [...items, race].sort((a, b) => a.date.localeCompare(b.date)))}
            onAddGoal={(goal) => setGoals((items) => [goal, ...items.filter((item) => item.id !== goal.id)])}
            onAddActivity={(activity) => setActivities((items) => mergeActivitiesById({ current: items, incoming: [activity] }))}
            onAddBlock={(block) => setBlockedDates((items) => [...items, block])}
          />
          <DataControlsPanel
            snapshot={{ races, goals, activities, blockedDates, decisionLog, currentState: state, theme }}
            onImport={importSnapshot}
            onResetLocalData={resetLocalData}
          />
          <ActivityPanel activities={activities} />
        </div>
      </div>
    </main>
  )
}
