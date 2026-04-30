import { InfoTooltip } from './InfoTooltip'

const raceCostBands = [
  { label: 'Low', range: '0–39', className: 'cost-low', meaning: 'Normal aerobic or low-impact load.' },
  { label: 'Medium', range: '40–59', className: 'cost-medium', meaning: 'Some recovery cost; keep the next session controlled.' },
  { label: 'High', range: '60–79', className: 'cost-high', meaning: 'Meaningful fatigue; avoid stacking intensity.' },
  { label: 'Extreme', range: '80+', className: 'cost-extreme', meaning: 'Race-level recovery debt; damage-control mode likely.' },
]

const intensityBands = [
  { label: 'Rest', className: 'intensity-rest' },
  { label: 'Recovery', className: 'intensity-recovery' },
  { label: 'Easy/Z2', className: 'intensity-easy' },
  { label: 'Opener', className: 'intensity-opener' },
  { label: 'Race', className: 'intensity-race' },
]

export function LegendPanel() {
  return (
    <section className="panel legend-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Legend / manual</p>
          <h2>How to read the engine</h2>
        </div>
        <InfoTooltip label="Product rule" text="Fixed races are treated as mandatory. The engine only blocks racing for injury or illness; otherwise it changes the surrounding work to damage control." />
      </div>

      <div className="legend-grid">
        <div>
          <h3>Race cost</h3>
          <p>Estimated recovery burden from a race or hard event. It is not the same as raw load; intensity, context, race proximity, and fatigue can raise the cost.</p>
          <div className="legend-list">
            {raceCostBands.map((band) => (
              <div className="legend-row" key={band.label}>
                <span className={`legend-swatch ${band.className}`} />
                <strong>{band.label}</strong>
                <span>{band.range}</span>
                <p>{band.meaning}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3>Workout intensity</h3>
          <p>Colors separate today’s workout intensity from recovery risk. Blue means easy/recovery work; red means race/max effort. Simple, because ambiguity is how athletes accidentally invent tempo.</p>
          <div className="intensity-scale">
            {intensityBands.map((band) => <span className={`pill ${band.className}`} key={band.label}>{band.label}</span>)}
          </div>
          <ul className="manual-list">
            <li><strong>Damage Control:</strong> protect the next fixed race; no extra intensity.</li>
            <li><strong>RED:</strong> recovery-first state. Rest or easy movement only.</li>
            <li><strong>Race density:</strong> number of fixed races in each upcoming window.</li>
            <li><strong>HR/Power caps:</strong> ceilings, not targets. Stay below them.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
