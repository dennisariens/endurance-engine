import type { Activity, CurrentState } from '../domain/types'
import { explainRaceCost } from '../engine/raceCostEngine'
import { buildReadinessSignals } from '../engine/readinessSignalEngine'

type Props = {
  latestRaceActivity?: Activity
  state: CurrentState
}

const statusClass = (status: string) => status === 'red' ? 'red' : status === 'yellow' ? 'yellow' : status === 'green' ? 'green' : 'slate'

export function CostReadinessPanel({ latestRaceActivity, state }: Props) {
  const explanation = latestRaceActivity ? explainRaceCost(latestRaceActivity) : undefined
  const signals = buildReadinessSignals(state)

  return (
    <section className="panel cost-readiness-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">COST / READINESS</p>
          <h2>Race-cost transparency</h2>
          <p>Shows why AERION is cautious: latest race burden plus readiness signals. No black box. Irritatingly reasonable.</p>
        </div>
        <span className={`pill ${explanation?.band?.toLowerCase() ?? 'slate'}`}>{explanation ? `${explanation.score} / ${explanation.band}` : 'NO RACE COST'}</span>
      </div>

      <div className="cost-readiness-grid">
        <div className="cost-breakdown-section">
          <span className="field-label">Race-cost factors</span>
          {explanation ? (
            <>
              <strong>{explanation.activity.name}</strong>
              <p className="muted-copy">{explanation.activity.date} · score {explanation.score} · {explanation.band}</p>
              <div className="factor-list">
                {explanation.factors.map((factor) => (
                  <div className="factor-row" key={factor.label}>
                    <div>
                      <strong>{factor.label}</strong>
                      <span>{factor.value}</span>
                    </div>
                    <div className="factor-meter" aria-label={`${factor.label} ${factor.points.toFixed(1)} of ${factor.maxPoints} points`}>
                      <span style={{ width: `${Math.min(100, (factor.points / factor.maxPoints) * 100)}%` }} />
                    </div>
                    <strong>{factor.points.toFixed(1)}</strong>
                    <p>{factor.note}</p>
                  </div>
                ))}
              </div>
            </>
          ) : <p>No race-like activity loaded yet.</p>}
        </div>

        <div className="readiness-section">
          <span className="field-label">Readiness signals</span>
          <div className="readiness-grid">
            {signals.map((signal) => (
              <article className="readiness-tile" key={signal.label}>
                <div className="readiness-heading">
                  <strong>{signal.label}</strong>
                  <span className={`pill ${statusClass(signal.status)}`}>{signal.status}</span>
                </div>
                <p className="readiness-value">{signal.value}</p>
                <p>{signal.note}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
