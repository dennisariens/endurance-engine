import type { DecisionLogEntry } from '../domain/types'

type Props = {
  entries: DecisionLogEntry[]
  onClear: () => void
}

const actionTone: Record<DecisionLogEntry['action'], string> = {
  accepted: 'green',
  rested: 'blue',
  overridden: 'red',
}

export function DecisionHistoryPanel({ entries, onClear }: Props) {
  const visible = [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).slice(0, 6)
  return (
    <section className="panel decision-history">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Feedback loop</p>
          <h2>Decision log</h2>
        </div>
        {entries.length > 0 && <button className="ghost" type="button" onClick={onClear}>Clear log</button>}
      </div>
      {visible.length === 0 ? (
        <p>No decisions logged yet. Accept, rest, or override today’s plan to start building the adaptive trail.</p>
      ) : (
        <div className="history-list">
          {visible.map((entry) => (
            <article className="history-row" key={entry.id}>
              <div>
                <strong>{entry.date} · {entry.workoutTitle}</strong>
                <p>{entry.reason}</p>
                {entry.note && <p className="note">Note: {entry.note}</p>}
              </div>
              <div className="history-meta">
                <span className={`pill ${actionTone[entry.action]}`}>{entry.action}</span>
                <span className="pill slate">{entry.status}</span>
                {entry.hrCap && <span className="pill blue">HR ≤ {entry.hrCap}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
