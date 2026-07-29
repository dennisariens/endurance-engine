import type { ActualOverride } from '../engine/actualOverrideEngine'

type Props = {
  override: ActualOverride
}

const sourceLabel: Record<ActualOverride['authoritativeSource'], string> = {
  'completed-activity': 'COMPLETED ACTIVITY',
  'logged-intent': 'LOGGED INTENT',
  'planned-recommendation': 'PLANNED RECOMMENDATION',
}

export function ActualOverridePanel({ override }: Props) {
  return (
    <section className={`panel actual-override-panel tone-${override.severity}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">ACTUAL OVERRIDE</p>
          <h2>{override.headline}</h2>
          <p>{override.deltaSummary}</p>
        </div>
        <span className={`pill ${override.severity}`}>{sourceLabel[override.authoritativeSource]}</span>
      </div>

      <div className="actual-override-grid">
        <article>
          <span className="field-label">Planned</span>
          <p>{override.plannedSummary}</p>
        </article>
        <article>
          <span className="field-label">Logged</span>
          <p>{override.loggedSummary}</p>
        </article>
        <article>
          <span className="field-label">Completed</span>
          <p>{override.actualSummary}</p>
        </article>
      </div>

      <div className="actual-impact">
        <span className="field-label">Tomorrow impact</span>
        <p>{override.tomorrowImpact}</p>
      </div>
    </section>
  )
}
