import { useState } from 'react'
import type { Activity, BlockedDate, Race } from '../domain/types'
import { getLocalIsoDate } from '../engine/timelineEngine'

type EventFormsProps = {
  onAddRace: (race: Race) => void
  onAddActivity: (activity: Activity) => void
  onAddBlock: (block: BlockedDate) => void
}

const yesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return getLocalIsoDate(date)
}

export function EventForms({ onAddRace, onAddActivity, onAddBlock }: EventFormsProps) {
  const [raceName, setRaceName] = useState('')
  const [raceDate, setRaceDate] = useState('')
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
          <h2>Add race / actual activity / block</h2>
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
