import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import defaultActivities from '../data/activities.json'
import defaultBlockedDates from '../data/blocked-dates.json'
import defaultState from '../data/current-state.json'
import defaultRaces from '../data/races.json'
import { ActivityPanel } from './components/ActivityPanel'
import { CalendarPanel } from './components/CalendarPanel'
import { EventForms } from './components/EventForms'
import { MetricCard } from './components/MetricCard'
import type { Activity, BlockedDate, CurrentState, Race } from './domain/types'
import { daysBetween } from './engine/calendarEngine'
import { makeDailyDecision } from './engine/decisionEngine'
import { getLatestRaceCost } from './engine/raceCostEngine'
import { loadLocal, saveLocal } from './lib/storage'

const today = '2026-04-30'

export default function App() {
  const [races, setRaces] = useState<Race[]>(() => loadLocal('aerion:races', defaultRaces as Race[]))
  const [activities, setActivities] = useState<Activity[]>(() => loadLocal('aerion:activities', defaultActivities as Activity[]))
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => loadLocal('aerion:blocked', defaultBlockedDates as BlockedDate[]))
  const [state] = useState<CurrentState>(defaultState as CurrentState)

  useEffect(() => saveLocal('aerion:races', races), [races])
  useEffect(() => saveLocal('aerion:activities', activities), [activities])
  useEffect(() => saveLocal('aerion:blocked', blockedDates), [blockedDates])

  const decision = useMemo(() => makeDailyDecision({ today, races, activities, state }), [races, activities, state])
  const latestCost = useMemo(() => getLatestRaceCost(activities), [activities])
  const nextRace = decision.nextRace
  const nextRaceDetail = nextRace
    ? `${nextRace.date} · ${nextRace.distanceKm ?? 'TBD'} km · ${nextRace.elevationM ?? 'TBD'} m · Class ${nextRace.class ?? 'TBD'}`
    : 'No future race loaded'

  const statusTone = decision.status === 'Red' ? 'red' : decision.status === 'Yellow' ? 'yellow' : decision.status === 'InjuryIllness' ? 'purple' : 'green'

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">AERION · local MVP</p>
        <h1>Fixed-race endurance control</h1>
        <p>Race calendar first. Recovery consequences visible. Aerobic work protected.</p>
      </section>

      <section className="grid metrics-grid">
        <MetricCard label="Today" value={decision.mode.replace(/([A-Z])/g, ' $1').trim()} detail={decision.reasons[0]} tone={statusTone} />
        <MetricCard label="Next Race" value={nextRace?.name ?? 'None'} detail={nextRaceDetail} tone="blue" />
        <MetricCard label="Latest Race Cost" value={`${latestCost.score} / ${latestCost.band}`} detail={latestCost.activity?.name ?? 'No race activity loaded'} tone={latestCost.band === 'Extreme' ? 'red' : latestCost.band === 'High' ? 'yellow' : 'green'} />
        <MetricCard label="Recovery" value={`${state.recovery_status ?? 'unknown'}`.toUpperCase()} detail={`RHR ${state.resting_hr_14d_avg ?? 'n/a'} · HRV ${state.hrv_14d_avg ?? 'n/a'} · Sleep ${state.sleep_hours_14d_avg ?? 'n/a'}h`} tone={statusTone} />
        <MetricCard label="Aerobic Engine" value={decision.today} detail={`HR cap ${decision.hrCap ?? 'open'} · eFTP ${state.eftp_watts ?? 'n/a'} W`} tone="green" />
        <MetricCard label="Race Block" value={decision.raceBlock.active ? 'ACTIVE' : 'Clear'} detail={decision.raceBlock.reason} tone={decision.raceBlock.active ? 'yellow' : 'slate'} />
      </section>

      <section className="briefing panel">
        <div>
          <p className="eyebrow">Daily decision</p>
          <h2>{decision.today}: {decision.mode}</h2>
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
