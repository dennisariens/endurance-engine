import { useEffect } from 'react'
import './styles.css'
import { ActivityPanel } from './components/ActivityPanel'
import { ActualOverridePanel } from './components/ActualOverridePanel'
import { BaselineZonesPanel } from './components/BaselineZonesPanel'
import { CalendarPanel } from './components/CalendarPanel'
import { CoachActionLoopPanel } from './components/CoachActionLoopPanel'
import { CoachBriefingPanel } from './components/CoachBriefingPanel'
import { CostReadinessPanel } from './components/CostReadinessPanel'
import { DataControlsPanel, type AerionLocalSnapshot } from './components/DataControlsPanel'
import { DecisionHistoryPanel } from './components/DecisionHistoryPanel'
import { EventForms } from './components/EventForms'
import { GoalControlPanel } from './components/GoalControlPanel'
import { LegendPanel } from './components/LegendPanel'
import { MethodologyPanel } from './components/MethodologyPanel'
import { MorningReadinessPanel } from './components/MorningReadinessPanel'
import { MetricCard } from './components/MetricCard'
import { Next72PlanPanel } from './components/Next72PlanPanel'
import { OperationalLogPanel } from './components/OperationalLogPanel'
import { PathToGoalPanel } from './components/PathToGoalPanel'
import { PremiumCommandDeck } from './components/PremiumCommandDeck'
import { ScenarioSimulationPanel } from './components/ScenarioSimulationPanel'
import { StatsPanel } from './components/StatsPanel'
import { SyncStatusPanel } from './components/SyncStatusPanel'
import { TodayPlanPanel } from './components/TodayPlanPanel'
import { WorkoutPanel } from './components/WorkoutPanel'
import { dedupeSyncedActivities, mergeRacesByStableId } from './data/integrations/dedupe'
import type { CoachScenarioId, DecisionLogAction, DecisionLogEntry } from './domain/types'
import { daysBetween } from './engine/calendarEngine'
import type { ScenarioOutcome } from './engine/scenarioSimulationEngine'
import { getLocalIsoDate } from './engine/timelineEngine'
import { useAerionDerivedState } from './hooks/useAerionDerivedState'
import { useAerionImports } from './hooks/useAerionImports'
import { useAerionState } from './hooks/useAerionState'
import { useOpeningSync } from './hooks/useOpeningSync'

const today = getLocalIsoDate()
function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
const yesterday = addDays(today, -1)
const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()

export default function App() {
  const {
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
  } = useAerionState()
  const { syncStatus, runOpeningSync } = useOpeningSync({ setActivities, setRaces, setState })
  const snapshot = { races, goals, goalConversation, activities, blockedDates, decisionLog, currentState: state, theme, account, visualization }
  const { exportLocalData, importLocalData, importGarminRecovery, importStravaActivities } = useAerionImports({ snapshot, importSnapshot, setActivities, setState })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])


  const {
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
    integrations,
    activeGoal,
    goalReadiness,
    pathToGoal,
    trajectory,
    learning,
    dailyRecommendation,
    coachBriefing,
    nextRace,
    nextRaceDetail,
    statusTone,
  } = useAerionDerivedState({ today, yesterday, races, goals, activeGoalId, activities, decisionLog, state, syncStatus })
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

  const logScenarioChoice = (scenario: ScenarioOutcome) => {
    const action = `scenario-${scenario.id}` as DecisionLogAction
    const entry: DecisionLogEntry = {
      id: crypto.randomUUID(),
      date: today,
      loggedAt: new Date().toISOString(),
      action,
      mode: decision.mode,
      status: decision.status,
      workoutTitle: scenario.label,
      durationMin: scenario.id === 'rest' ? 0 : recommendation.primary.durationMin,
      hrCap: scenario.id === 'rest' ? undefined : recommendation.primary.hrCap,
      powerCap: scenario.id === 'rest' ? undefined : recommendation.primary.powerCap,
      reason: scenario.nextRaceRisk,
      note: scenario.consequence,
      nextRaceName: nextRace?.name,
      scenarioId: scenario.id as CoachScenarioId,
      scenarioLabel: scenario.label,
      scenarioExpectedCostRange: scenario.expectedCostRange,
      scenarioFatigueDeltaRange: scenario.tomorrowFatigueDeltaRange,
      scenarioRecoveryLagRange: scenario.recoveryLagDaysRange,
    }
    setDecisionLog((items) => [entry, ...items.filter((item) => item.date !== today)])
  }

  const deleteGoal = (goalId: string) => {
    setGoals((items) => {
      const nextGoals = items.filter((item) => item.id !== goalId)
      setActiveGoalId((current) => current === goalId ? nextGoals[0]?.id : current)
      return nextGoals
    })
    setGoalConversation((items) => items.filter((entry) => entry.goalId !== goalId))
  }

  return (
    <main className="app">
      <div className="app-toolbar">
        <button className="theme-toggle icon-button" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </div>

      <SyncStatusPanel status={syncStatus} today={today} />
      <PremiumCommandDeck
        today={today}
        decision={decision}
        recommendation={recommendation}
        briefing={coachBriefing}
        dailyRecommendation={dailyRecommendation}
        morningReadiness={morningReadiness}
        next72Plan={next72Plan}
        stats={stats}
        activities={activities}
        decisionLog={decisionLog}
        races={races}
        goals={goals}
        activeGoal={activeGoal}
        goalConversation={goalConversation}
        state={state}
        account={account}
        visualization={visualization}
        readiness={goalReadiness}
        trajectory={trajectory}
        learning={learning}
        syncStatus={syncStatus}
        integrations={integrations}
        path={pathToGoal}
        onSelectGoal={setActiveGoalId}
        onAddGoal={(goal) => {
          setGoals((items) => [goal, ...items.filter((item) => item.id !== goal.id)])
          setActiveGoalId(goal.id)
        }}
        onDeleteGoal={deleteGoal}
        onAddRace={(race) => setRaces((items) => [...items, race].sort((a, b) => a.date.localeCompare(b.date)))}
        onAddGoalConversation={(entry) => setGoalConversation((items) => [entry, ...items])}
        onDeleteGoalConversation={(entryId) => setGoalConversation((items) => items.filter((entry) => entry.id !== entryId))}
        onUpdateAccount={(value) => setAccount({ ...value, lastChangedAt: new Date().toISOString() })}
        onUpdateVisualization={setVisualization}
        onSyncIntervals={runOpeningSync}
        onImportGarminRecovery={importGarminRecovery}
        onImportStravaActivities={importStravaActivities}
        onExportLocalData={exportLocalData}
        onImportLocalData={importLocalData}
        onAddActivities={(incoming) => setActivities((items) => dedupeSyncedActivities([...items, ...incoming]))}
      />
      <details className="expert-layer">
        <summary>Expert cockpit / debug layer</summary>
        <div className="expert-layer-content">
          <CoachBriefingPanel briefing={coachBriefing} />

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

          <TodayPlanPanel decision={decision} recommendation={recommendation} nextRaceName={nextRace?.name} latestAction={latestDecisionAction} onLogDecision={logDecision} />
          <ScenarioSimulationPanel simulation={scenarioSimulation} selectedScenarioId={selectedScenarioId} onSelectScenario={logScenarioChoice} />
          <CoachActionLoopPanel loop={coachActionLoop} />
          <ActualOverridePanel override={actualOverride} />
          <MorningReadinessPanel verdict={morningReadiness} />
          <Next72PlanPanel plan={next72Plan} />
          <PathToGoalPanel readiness={goalReadiness} path={pathToGoal} />
          <GoalControlPanel goals={goals} activeGoalId={activeGoal?.id} onSelectGoal={setActiveGoalId} onUpdateGoal={(goal) => setGoals((items) => items.map((item) => item.id === goal.id ? goal : item))} onDeleteGoal={deleteGoal} />
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
              <EventForms onAddRace={(race) => setRaces((items) => mergeRacesByStableId(items, [race]))} onAddGoal={(goal) => setGoals((items) => [goal, ...items.filter((item) => item.id !== goal.id)])} onAddActivity={(activity) => setActivities((items) => dedupeSyncedActivities([...items, activity]))} onAddBlock={(block) => setBlockedDates((items) => [...items, block])} />
              <DataControlsPanel snapshot={snapshot} onImport={importSnapshot} onResetLocalData={resetLocalData} />
              <ActivityPanel activities={activities} />
            </div>
          </div>
        </div>
      </details>
    </main>
  )
}
