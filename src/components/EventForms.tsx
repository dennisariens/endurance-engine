import { useState } from 'react'
import type { Activity, BlockedDate, Race } from '../domain/types'

type EventFormsProps = {
  onAddRace: (race: Race) => void
  onAddActivity: (activity: Activity) => void
  onAddBlock: (block: BlockedDate) => void
}

export function EventForms({ onAddRace, onAddActivity, onAddBlock }: EventFormsProps) {
  const [raceName, setRaceName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [activityName, setActivityName] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState<BlockedDate['reason']>('travel')

  return (
    <section className="panel forms-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Control</p>
          <h2>Add race / activity / block</h2>
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
        onAddActivity({ id: crypto.randomUUID(), source: 'manual', date: activityDate, name: activityName, type: 'Manual', raceCost: 30, raceCostBand: 'Low' })
        setActivityName('')
      }}>
        <label>Activity</label>
        <div className="form-row">
          <input value={activityDate} onChange={(event) => setActivityDate(event.target.value)} type="date" />
          <input value={activityName} onChange={(event) => setActivityName(event.target.value)} placeholder="Activity name" />
          <button>Add activity</button>
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
