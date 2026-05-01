import type { CurrentState } from '../domain/types'

type Props = { state: CurrentState; activityCount: number; raceCount: number }

export function MethodologyPanel({ state, activityCount, raceCount }: Props) {
  return (
    <section className="panel methodology-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Methodology / data trust</p>
          <h2>Why the engine says what it says</h2>
        </div>
        <span className="pill blue">Last state: {state.last_updated ?? 'unknown'}</span>
      </div>
      <div className="method-grid">
        <div>
          <span className="field-label">Inputs</span>
          <p>{raceCount} fixed races · {activityCount} recent activities · recovery {state.recovery_status}</p>
        </div>
        <div>
          <span className="field-label">Caps</span>
          <p>HR caps derive from AeT/LTHR when available, otherwise conservative max-HR fallback. eFTP sets easy power ceiling.</p>
        </div>
        <div>
          <span className="field-label">Race cost</span>
          <p>Estimated burden, not raw TSS. Context can make equal load more or less expensive.</p>
        </div>
        <div>
          <span className="field-label">Limitations</span>
          <p>Opening sync runs through the local Vite server when `INTERVALS_ICU_API_KEY` is present. The browser never receives the key. Without it, AERION uses fixture + manual data.</p>
        </div>
      </div>
    </section>
  )
}
