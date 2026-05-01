import { useState } from 'react'
import type { DailyDecision, DecisionLogAction, WorkoutRecommendation } from '../domain/types'
import { InfoTooltip } from './InfoTooltip'

type Props = {
  decision: DailyDecision
  recommendation: WorkoutRecommendation
  nextRaceName?: string
  latestAction?: DecisionLogAction
  onLogDecision: (action: DecisionLogAction, note?: string) => void
}

const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()

export function TodayPlanPanel({ decision, recommendation, nextRaceName, latestAction, onLogDecision }: Props) {
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideNote, setOverrideNote] = useState('')
  const avoid = decision.mode === 'DamageControl' || decision.status === 'Red'
    ? ['Intensity', 'Strength', 'Fasting', 'Weight-cutting']
    : ['Grey-zone junk', 'Unplanned race efforts']

  return (
    <section className={`panel today-plan status-${decision.status.toLowerCase()}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Today’s plan</p>
          <h2>{formatLabel(decision.mode)} · {recommendation.primary.title}</h2>
          {latestAction && <p className="save-state">Logged today: {latestAction}</p>}
        </div>
        <div className="plan-actions">
          <button type="button" onClick={() => onLogDecision('accepted')}>Accept plan</button>
          <button className="ghost" type="button" onClick={() => onLogDecision('rested', 'Marked as full rest instead of optional movement.')}>Mark rest</button>
          <button className="ghost" type="button" onClick={() => setOverrideOpen((value) => !value)}>Override</button>
        </div>
      </div>
      {overrideOpen && (
        <form className="override-box" onSubmit={(event) => {
          event.preventDefault()
          onLogDecision('overridden', overrideNote || 'Override logged without note.')
          setOverrideNote('')
          setOverrideOpen(false)
        }}>
          <label>Override reason</label>
          <div className="override-row">
            <input value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} placeholder="Why are you ignoring the machine today?" />
            <button type="submit">Save override</button>
          </div>
        </form>
      )}
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
