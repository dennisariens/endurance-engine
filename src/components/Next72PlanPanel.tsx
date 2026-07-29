import type { Next72Plan } from '../engine/recoveryPlanEngine'

type Props = {
  plan: Next72Plan
}

export function Next72PlanPanel({ plan }: Props) {
  return (
    <section className="panel next72-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">NEXT 72H</p>
          <h2>Recovery control plan</h2>
          <p>{plan.summary}</p>
        </div>
        <span className={`pill ${plan.risk === 'InjuryIllness' ? 'purple' : plan.risk === 'Extreme' || plan.risk === 'High' ? 'red' : plan.risk === 'Medium' ? 'yellow' : 'green'}`}>
          {plan.risk === 'InjuryIllness' ? 'BLOCKED' : `${plan.risk} RISK`}
        </span>
      </div>

      {plan.recalculation && (
        <div className="forward-recalc">
          <span className="field-label">Forward recalculation</span>
          <strong>{plan.recalculation.status.replace(/-/g, ' ')}</strong>
          <p>{plan.recalculation.summary}</p>
          <p>{plan.recalculation.tomorrowAdjustment}</p>
          <span className="pill yellow">Impact {plan.recalculation.impactRange.low}–{plan.recalculation.impactRange.high}h</span>
        </div>
      )}

      {plan.morningReadiness && (
        <div className="forward-recalc">
          <span className="field-label">Morning readiness applied</span>
          <strong>{plan.morningReadiness.verdict}</strong>
          <p>{plan.morningReadiness.summary}</p>
          <span className="pill yellow">{plan.morningReadiness.forwardState}</span>
        </div>
      )}

      <div className="next72-grid">
        {plan.blocks.map((block) => (
          <article className={`next72-card tone-${block.tone}`} key={`${block.horizon}-${block.date}`}>
            <div className="next72-card-header">
              <span className="field-label">{block.horizon}</span>
              <span className="muted-copy">{block.date}</span>
            </div>
            <h3>{block.action}</h3>
            <div>
              <span className="field-label">Allowed</span>
              <ul>
                {block.allowedWork.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <span className="field-label">Hard limits</span>
              <ul>
                {block.hardLimits.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <p className="next72-why">{block.why}</p>
          </article>
        ))}
      </div>

      <p className="muted-copy">Caps are ceilings, not targets. HR zones remain provisional until LTHR/AeT/drift tests exist.</p>
    </section>
  )
}
