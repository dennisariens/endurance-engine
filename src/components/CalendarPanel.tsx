import type { BlockedDate, Race } from '../domain/types'
import { daysBetween } from '../engine/calendarEngine'

type CalendarPanelProps = {
  races: Race[]
  blockedDates: BlockedDate[]
  today: string
  onDeleteRace: (id: string) => void
}

export function CalendarPanel({ races, blockedDates, today, onDeleteRace }: CalendarPanelProps) {
  const nextRaces = [...races]
    .filter((race) => daysBetween(today, race.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 16)

  return (
    <section className="panel calendar-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Fixed race queue</h2>
        </div>
        <span className="pill blue">{races.length} races</span>
      </div>

      <div className="race-list">
        {nextRaces.map((race) => (
          <div className="race-row" key={race.id}>
            <div className="date-tile">
              <span>{new Date(`${race.date}T00:00:00`).toLocaleDateString('en', { month: 'short' })}</span>
              <strong>{new Date(`${race.date}T00:00:00`).getDate()}</strong>
            </div>
            <div className="race-main">
              <strong>{race.name}</strong>
              <p>{race.series} · {race.format?.toUpperCase?.() ?? 'ROAD'} · Class {race.class ?? 'TBD'}</p>
            </div>
            <span className="pill cyan">Fixed</span>
            <button className="ghost" onClick={() => onDeleteRace(race.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="blocked-strip">
        <p className="eyebrow">Blocked dates</p>
        {blockedDates.length === 0 ? <p>No blocked dates yet.</p> : blockedDates.map((block) => (
          <span className="pill purple" key={block.id}>{block.startDate} · {block.reason}</span>
        ))}
      </div>
    </section>
  )
}
