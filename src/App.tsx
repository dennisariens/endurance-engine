import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import defaultActivities from '../data/activities.json'
import defaultBlockedDates from '../data/blocked-dates.json'
import defaultState from '../data/current-state.json'
import defaultRaces from '../data/races.json'
import { ActivityPanel } from './components/ActivityPanel'
import { CalendarPanel } from './components/CalendarPanel'
import { EventForms } from './components/EventForms'
import { LegendPanel } from './components/LegendPanel'
import { MetricCard } from './components/MetricCard'
import { StatsPanel } from './components/StatsPanel'
import { TodayPlanPanel } from './components/TodayPlanPanel'
import { WorkoutPanel } from './components/WorkoutPanel'
import type { Activity, BlockedDate, CurrentState, Race, Theme } from './domain/types'
import { daysBetween } from './engine/calendarEngine'
import { makeDailyDecision } from './engine/decisionEngine'
import { getLatestRaceCost } from './engine/raceCostEngine'
import { buildDashboardStats } from './engine/statsEngine'
import { makeWorkoutRecommendation } from './engine/workoutEngine'
import { loadLocal, saveLocal } from './lib/storage'

const today = '2026-04-30'
const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()

export default function App() {
  const [races, setRaces] = useState<Race[]>(() => loadLocal('aerion:races', defaultRaces as Race[]))
  const [activities, setActivities] = useState<Activity[]>(() => loadLocal('aerion:activities', defaultActivities as Activity[]))
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => loadLocal('aerion:blocked', defaultBlockedDates as BlockedDate[]))
  const [theme, setTheme] = useState<Theme>(() => loadLocal('aerion:theme', 'dark' as Theme))
  const [state] = useState<CurrentState>(defaultState as CurrentState)

  useEffect(() => saveLocal('aerion:races', races), [races])
  useEffect(() => saveLocal('aerion:activities', activities), [activities])
  useEffect(() => saveLocal('aerion:blocked', blockedDates), [blockedDates])
  useEffect(() => saveLocal('aerion:theme', theme), [theme])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const decision = useMemo(() => makeDailyDecision({ today, races, activities, state }), [races, activities, state])
  const latestCost = useMemo(() => getLatestRaceCost(activities), [activities])
  const recommendation = useMemo(() => makeWorkoutRecommendation({ decision, state }), [decision, state])
  const stats = useMemo(() => buildDashboardStats({ today, races, activities }), [races, activities])
  const nextRace = decision.nextRace
  const nextRaceDetail = nextRace
    ? `${nextRace.date} · ${nextRace.distanceKm ?? 'TBD'} km · ${nextRace.elevationM ?? 'TBD'} m · Class ${nextRace.class ?? 'TBD'}`
    : 'No future race loaded'

  const statusTone = decision.status === 'Red' ? 'red' : decision.status === 'Yellow' ? 'yellow' : decision.status === 'InjuryIllness' ? 'purple' : 'green'

  return (
    <main className="app">
      <section className="hero topbar">
        <div>
          <p className="eyebrow">AERION · local MVP</p>
          <h1>Fixed-race endurance control</h1>
          <p>Race calendar first. Recovery consequences visible. Aerobic work protected.</p>
        </div>
        <button className="theme-toggle icon-button" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </section>

      <section className="grid metrics-grid">
        <MetricCard label="Today" value={formatLabel(decision.mode)} detail={decision.reasons[0]} tone={statusTone} tooltip="Primary operating mode for today. Damage Control means protect freshness around a fixed race, not chase fitness today." />
        <MetricCard label="Next Race" value={nextRace?.name ?? 'None'} detail={nextRaceDetail} tone="blue" tooltip="The next fixed event driving the plan. Fixed races are not blocked unless injury or illness is present." />
        <MetricCard label="Latest Race Cost" value={`${latestCost.score} / ${latestCost.band}`} detail={latestCost.activity?.name ?? 'No race activity loaded'} tone={latestCost.band === 'Extreme' ? 'red' : latestCost.band === 'High' ? 'yellow' : 'green'} tooltip="Race cost estimates recovery burden on a 0–100 scale: low 0–39, medium 40–59, high 60–79, extreme 80+." />
        <MetricCard label="Recovery" value={`${state.recovery_status ?? 'unknown'}`.toUpperCase()} detail={`RHR ${state.resting_hr_14d_avg ?? 'n/a'} · HRV ${state.hrv_14d_avg ?? 'n/a'} · Sleep ${state.sleep_hours_14d_avg ?? 'n/a'}h`} tone={statusTone} tooltip="Recovery state combines available fatigue signals and latest race cost. RED means no intensity unless a fixed race forces damage control." />
        <MetricCard label="Workout" value={recommendation.primary.title} detail={`${recommendation.primary.durationMin || 'Off'} min · ${recommendation.primary.hrCap ? `HR ≤ ${recommendation.primary.hrCap}` : recommendation.primary.intensity}`} tone="green" tooltip="Suggested work if you insist on doing something. Caps are ceilings, not targets." />
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

      <TodayPlanPanel decision={decision} recommendation={recommendation} nextRaceName={nextRace?.name} />
      <LegendPanel />
      <WorkoutPanel recommendation={recommendation} />
      <StatsPanel stats={stats} />

      <div className="two-col">
        <CalendarPanel races={races} blockedDates={blockedDates} today={today} onDeleteRace={(id) => setRaces((items) => items.filter((item) => item.id !== id))} />
        <div className="stack">
          <EventForms
            onAddRace={(race) => setRaces((items) => [...items, race].sort((a, b) => a.date.localeCompare(b.date)))}
            onAddActivity={(activity) => setActivities((items) => [...items, activity])}
            onAddBlock={(block) => setBlockedDates((items) => [...items, block])}
          />
          <ActivityPanel activities={activities} />
        </div>
      </div>
    </main>
  )
}
