import type { DailyDecision, WorkoutRecommendation } from '../domain/types'
import { InfoTooltip } from './InfoTooltip'

type Props = {
  decision: DailyDecision
  recommendation: WorkoutRecommendation
  nextRaceName?: string
}

const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()

export function TodayPlanPanel({ decision, recommendation, nextRaceName }: Props) {
  const avoid = decision.mode === 'DamageControl' || decision.status === 'Red'
    ? ['Intensity', 'Strength', 'Fasting', 'Weight-cutting']
    : ['Grey-zone junk', 'Unplanned race efforts']

  return (
    <section className={`panel today-plan status-${decision.status.toLowerCase()}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Today’s plan</p>
          <h2>{formatLabel(decision.mode)} · {recommendation.primary.title}</h2>
        </div>
        <div className="plan-actions">
          <button type="button">Accept plan</button>
          <button className="ghost" type="button">Mark rest</button>
          <button className="ghost" type="button">Override</button>
        </div>
      </div>
      <div className="plan-grid">
        <div>
          <span className="field-label">Do</span>
          <strong>{recommendation.primary.durationMin ? `${recommendation.primary.durationMin} min` : 'Full rest'}</strong>
          <p>{recommendation.primary.purpose}</p>
        </div>
        <div>
          <span className="field-label">Caps</span>
          <strong>{recommendation.primary.hrCap ? `HR ≤ ${recommendation.primary.hrCap}` : 'No cap needed'}</strong>
          <p>{recommendation.primary.powerCap ? `Power ≤ ${recommendation.primary.powerCap} W. ` : ''}Caps are ceilings, not targets.</p>
        </div>
        <div>
          <span className="field-label">Why</span>
          <strong>{nextRaceName ? `${nextRaceName} is next` : 'Calendar + recovery'}</strong>
          <p>{decision.reasons.slice(0, 2).join(' · ')}</p>
        </div>
        <div>
          <span className="field-label">Avoid</span>
          <div className="avoid-list">{avoid.map((item) => <span className="pill red" key={item}>{item}</span>)}</div>
        </div>
      </div>
      <details className="why-box">
        <summary>Why this recommendation? <InfoTooltip label="Explainability" text="The engine combines fixed race proximity, latest race cost, recovery status, and injury/illness flags before prescribing load." /></summary>
        <ul>
          {decision.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          <li>Fixed races remain allowed unless injury or illness is present.</li>
        </ul>
      </details>
    </section>
  )
}
