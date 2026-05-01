import type { TimelineItem } from '../engine/timelineEngine'

type Props = {
  items: TimelineItem[]
}

const statusLabel: Record<TimelineItem['status'], string> = {
  scheduled: 'scheduled',
  'actual-no-plan-click': 'actual / no click',
  'completed-after-acceptance': 'accepted + done',
  'decision-only': 'planned only',
  override: 'override',
  rested: 'rested',
}

export function OperationalLogPanel({ items }: Props) {
  const visible = items.slice(0, 14)
  return (
    <section className="panel operational-log">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Calendar + actuals</p>
          <h2>Operational log</h2>
        </div>
        <span className="pill blue">next/recent {visible.length}</span>
      </div>
      <div className="timeline-list">
        {visible.map((item) => (
          <article className="timeline-row" key={item.id}>
            <div className="date-tile small">
              <span>{new Date(`${item.date}T00:00:00`).toLocaleDateString('en', { month: 'short' })}</span>
              <strong>{new Date(`${item.date}T00:00:00`).getDate()}</strong>
            </div>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <div className="history-meta">
              <span className={`pill ${item.tone}`}>{item.kind}</span>
              <span className="pill slate">{statusLabel[item.status]}</span>
              {item.source && <span className="pill purple">{item.source}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
