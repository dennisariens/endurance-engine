import { useState } from 'react'
import type { Activity, BlockedDate, Goal, GoalDiscipline, GoalStatus, GoalType, Race } from '../domain/types'
import { getLocalIsoDate } from '../engine/timelineEngine'

type EventFormsProps = {
  onAddRace: (race: Race) => void
  onAddActivity: (activity: Activity) => void
  onAddBlock: (block: BlockedDate) => void
  onAddGoal: (goal: Goal) => void
}

const yesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return getLocalIsoDate(date)
}

export function EventForms({ onAddRace, onAddActivity, onAddBlock, onAddGoal }: EventFormsProps) {
  const [raceName, setRaceName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [goalName, setGoalName] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('floating-goal')
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('draft')
  const [goalDiscipline, setGoalDiscipline] = useState<GoalDiscipline>('triathlon')
  const [activityName, setActivityName] = useState('')
  const [activityDate, setActivityDate] = useState(yesterday())
  const [activityType, setActivityType] = useState('Ride')
  const [activityMinutes, setActivityMinutes] = useState('45')
  const [activityLoad, setActivityLoad] = useState('35')
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState<BlockedDate['reason']>('travel')

  return (
    <section className="panel forms-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control</p>
          <h2>Add race / goal / actual activity / block</h2>
        </div>
      </div>

      <form onSubmit={(event) => {
        event.preventDefault()
        if (!raceName || !raceDate) return
        onAddRace({ id: crypto.randomUUID(), date: raceDate, name: raceName, discipline: 'cycling', priority: 'fixed', mandatory: true, format: 'road', notes: 'Manual fixed race' })
        setRaceName('')
      }}>
        <label>Fixed race</label>
        <div className="form-row">
          <input value={raceDate} onChange={(event) => setRaceDate(event.target.value)} type="date" />
          <input value={raceName} onChange={(event) => setRaceName(event.target.value)} placeholder="Race name" />
          <button>Add race</button>
        </div>
      </form>

      <form onSubmit={(event) => {
        event.preventDefault()
        if (!goalName) return
        const fixedType = goalType === 'fixed-date-race' || goalType === 'committed-race' || goalType === 'mandatory-race' || goalType === 'candidate-event' || goalType === 'key-performance-goal'
        if (fixedType && !goalDate) return
        onAddGoal({
          id: crypto.randomUUID(),
          name: goalName,
          type: goalType,
          status: goalType === 'mandatory-race' ? 'mandatory' : goalStatus,
          discipline: goalDiscipline,
          targetDate: goalDate || null,
          description: 'Manual AERION goal',
          priority: goalStatus === 'key-event' || goalStatus === 'mandatory' ? 'high' : 'medium',
        })
        setGoalName('')
      }}>
        <label>Future goal / event — fixed date or floating target</label>
        <div className="form-row goal-form-row">
          <input value={goalDate} onChange={(event) => setGoalDate(event.target.value)} type="date" aria-label="Goal date" />
          <input value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="e.g. Ironman Lanzarote" />
          <select value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)}>
            <option value="floating-goal">Floating goal</option>
            <option value="candidate-event">Candidate event</option>
            <option value="fixed-date-race">Fixed-date race</option>
            <option value="committed-race">Committed race</option>
            <option value="mandatory-race">Mandatory race</option>
            <option value="key-performance-goal">Key performance goal</option>
          </select>
          <select value={goalStatus} onChange={(event) => setGoalStatus(event.target.value as GoalStatus)}>
            <option value="draft">Draft</option>
            <option value="candidate">Candidate</option>
            <option value="committed">Committed</option>
            <option value="key-event">Key event</option>
            <option value="mandatory">Mandatory</option>
          </select>
          <select value={goalDiscipline} onChange={(event) => setGoalDiscipline(event.target.value as GoalDiscipline)}>
            <option value="triathlon">Triathlon</option>
            <option value="cycling">Cycling</option>
            <option value="running">Running</option>
            <option value="endurance">Endurance</option>
            <option value="other">Other</option>
          </select>
          <button>Add goal</button>
        </div>
      </form>

      <form onSubmit={(event) => {
        event.preventDefault()
        if (!activityName || !activityDate) return
        const minutes = Number(activityMinutes)
        const load = Number(activityLoad)
        onAddActivity({
          id: crypto.randomUUID(),
          source: 'manual',
          date: activityDate,
          name: activityName,
          type: activityType,
          durationSec: Number.isFinite(minutes) ? minutes * 60 : undefined,
          load: Number.isFinite(load) ? load : undefined,
        })
        setActivityName('')
      }}>
        <label>Actual activity — use this when you ignored the recommendation but did work anyway</label>
        <div className="form-row activity-form-row">
          <input value={activityDate} onChange={(event) => setActivityDate(event.target.value)} type="date" />
          <input value={activityName} onChange={(event) => setActivityName(event.target.value)} placeholder="e.g. Sort-like ride" />
          <select value={activityType} onChange={(event) => setActivityType(event.target.value)}>
            <option value="Ride">Ride</option>
            <option value="VirtualRide">VirtualRide</option>
            <option value="Run">Run</option>
            <option value="Strength">Strength</option>
            <option value="Walk">Walk</option>
            <option value="Manual">Manual</option>
          </select>
          <input value={activityMinutes} onChange={(event) => setActivityMinutes(event.target.value)} inputMode="numeric" placeholder="min" />
          <input value={activityLoad} onChange={(event) => setActivityLoad(event.target.value)} inputMode="numeric" placeholder="load" />
          <button>Add actual</button>
        </div>
      </form>

      <form onSubmit={(event) => {
        event.preventDefault()
        if (!blockDate) return
        onAddBlock({ id: crypto.randomUUID(), startDate: blockDate, endDate: blockDate, reason: blockReason, blocksRace: blockReason === 'injury' || blockReason === 'illness' })
      }}>
        <label>Blocked date</label>
        <div className="form-row">
          <input value={blockDate} onChange={(event) => setBlockDate(event.target.value)} type="date" />
          <select value={blockReason} onChange={(event) => setBlockReason(event.target.value as BlockedDate['reason'])}>
            <option value="travel">travel</option>
            <option value="work">work</option>
            <option value="illness">illness</option>
            <option value="injury">injury</option>
            <option value="recovery">recovery</option>
            <option value="unavailable">unavailable</option>
            <option value="other">other</option>
          </select>
          <button>Add block</button>
        </div>
      </form>
    </section>
  )
}
