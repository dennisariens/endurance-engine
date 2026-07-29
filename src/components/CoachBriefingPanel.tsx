import type { CoachBriefing } from '../engine/coachBriefingEngine'

type Props = {
  briefing: CoachBriefing
}

const confidenceTone = (confidence: CoachBriefing['confidence']) => confidence === 'high' ? 'green' : confidence === 'medium' ? 'yellow' : 'slate'

export function CoachBriefingPanel({ briefing }: Props) {
  return (
    <section className={`coach-brief panel tone-${briefing.tone}`}>
      <div className="coach-brief-main">
        <div>
          <p className="eyebrow">AERION COACH</p>
          <h2>{briefing.headline}</h2>
          <p>{briefing.status}</p>
        </div>
        <div className="coach-brief-status">
          <span className={`pill ${briefing.tone}`}>Constraint: {briefing.dominantConstraint}</span>
          <span className={`pill ${confidenceTone(briefing.confidence)}`}>Confidence: {briefing.confidence}</span>
        </div>
      </div>

      <div className="coach-brief-grid">
        <article>
          <span className="field-label">Recommendation</span>
          <strong>{briefing.recommendation}</strong>
          <p>Advisory, not restrictive. Actual completed work remains authoritative.</p>
        </article>
        <article>
          <span className="field-label">If you ignore it</span>
          <strong>Consequence</strong>
          <p>{briefing.consequence}</p>
        </article>
        <article>
          <span className="field-label">Next action</span>
          <strong>Do this now</strong>
          <p>{briefing.nextAction}</p>
        </article>
        <article>
          <span className="field-label">Missing signals</span>
          <strong>{briefing.missingSignals.length ? `${briefing.missingSignals.length} not synced` : 'Signal set complete'}</strong>
          <p>{briefing.missingSignals.length ? briefing.missingSignals.join(' · ') : 'Enough data is available for today’s coach loop.'}</p>
        </article>
      </div>
    </section>
  )
}
