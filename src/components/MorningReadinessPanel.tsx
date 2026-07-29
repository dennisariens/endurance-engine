import type { MorningReadinessVerdict } from '../engine/morningReadinessEngine'

type Props = {
  verdict: MorningReadinessVerdict
}

const forwardLabel: Record<MorningReadinessVerdict['forwardState'], string> = {
  clear: 'FORWARD CLEAR',
  hold: 'FORWARD HOLD',
  extend: 'FORWARD EXTEND',
}

export function MorningReadinessPanel({ verdict }: Props) {
  return (
    <section className={`panel morning-readiness-panel tone-${verdict.tone}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">MORNING READINESS</p>
          <h2>{verdict.verdict}</h2>
          <p>{verdict.headline}</p>
        </div>
        <div className="status-stack">
          <span className={`pill ${verdict.tone}`}>{forwardLabel[verdict.forwardState]}</span>
          <span className="muted-copy">{verdict.date}</span>
        </div>
      </div>

      <div className="morning-grid">
        <article>
          <span className="field-label">Primary action</span>
          <strong>{verdict.primaryAction}</strong>
        </article>
        <article>
          <span className="field-label">Yesterday actual</span>
          <p>{verdict.yesterdaySummary}</p>
        </article>
      </div>

      <div className="morning-signal-grid">
        {verdict.signals.filter((signal) => ['Body Battery', 'Training Readiness', 'Sleep Score', 'Stress', 'HRV Status'].includes(signal.label)).map((signal) => (
          <article className={`signal-chip ${signal.status}`} key={signal.label}>
            <span className="field-label">{signal.label}</span>
            <strong>{signal.value}</strong>
            <p>{signal.status === 'unknown' ? 'not synced' : signal.status}</p>
          </article>
        ))}
      </div>

      <div className="reason-list">
        <span className="field-label">Why</span>
        <ul>
          {verdict.reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </section>
  )
}
