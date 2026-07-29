import type { CoachActionLoop } from '../engine/coachActionLoopEngine'

type Props = {
  loop: CoachActionLoop
}

const rangeLabel = (range?: { low: number; high: number }, suffix = '') => {
  if (!range) return 'n/a'
  return range.low === range.high ? `${range.low}${suffix}` : `${range.low}–${range.high}${suffix}`
}

export function CoachActionLoopPanel({ loop }: Props) {
  return (
    <section className="panel coach-action-loop-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">COACH ACTION LOOP</p>
          <h2>{loop.headline}</h2>
          <p>{loop.coachNote}</p>
        </div>
        <span className={`pill ${loop.status === 'logged' ? 'green' : 'yellow'}`}>
          {loop.status === 'logged' ? 'LOGGED' : 'AWAITING CHOICE'}
        </span>
      </div>

      <div className="coach-loop-grid">
        <article>
          <span className="field-label">Selected actual</span>
          <strong>{loop.selectedScenario?.label ?? 'No scenario logged yet'}</strong>
          <p>{loop.selectedScenario ? `Cost ${rangeLabel(loop.selectedScenario.expectedCostRange)} · Fatigue ${rangeLabel(loop.selectedScenario.tomorrowFatigueDeltaRange)} · Lag ${rangeLabel(loop.selectedScenario.recoveryLagDaysRange, 'd')}` : 'Choose what actually happened today. The next recommendation recalculates from there.'}</p>
        </article>
        <article>
          <span className="field-label">Tomorrow adjustment</span>
          <strong>{loop.status === 'logged' ? 'Recalculated from actual' : 'Pending actual'}</strong>
          <p>{loop.tomorrowAdjustment}</p>
        </article>
        <article>
          <span className="field-label">Guardrails</span>
          <div className="avoid-list">{loop.guardrails.map((item) => <span className="pill slate" key={item}>{item}</span>)}</div>
        </article>
      </div>
    </section>
  )
}
