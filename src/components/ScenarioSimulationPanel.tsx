import type { EstimateRange, ScenarioOutcome, ScenarioSimulation } from '../engine/scenarioSimulationEngine'

type Props = {
  simulation: ScenarioSimulation
  selectedScenarioId?: ScenarioOutcome['id']
  onSelectScenario?: (scenario: ScenarioOutcome) => void
}

const riskTone = (risk: ScenarioOutcome['performanceRisk']) => risk === 'blocked' ? 'purple' : risk === 'high' ? 'red' : risk === 'medium' ? 'yellow' : 'green'
const signed = (value: number) => value > 0 ? `+${value}` : `${value}`
const rangeLabel = (range: EstimateRange, suffix = '') => range.low === range.high ? `${range.low}${suffix}` : `${range.low}–${range.high}${suffix}`
const signedRangeLabel = (range: EstimateRange) => range.low === range.high ? signed(range.low) : `${signed(range.low)} to ${signed(range.high)}`

export function ScenarioSimulationPanel({ simulation, selectedScenarioId, onSelectScenario }: Props) {
  return (
    <section className="panel scenario-simulation-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">SCENARIO SIMULATION</p>
          <h2>What happens if you choose differently?</h2>
          <p>{simulation.summary}</p>
        </div>
        <div className="scenario-meta">
          <span className="pill blue">{simulation.primaryConstraint}</span>
          <span className="pill slate">{simulation.confidence.toUpperCase()} CONFIDENCE</span>
        </div>
      </div>

      <div className="scenario-grid">
        {simulation.scenarios.map((scenario) => (
          <article className={`scenario-card tone-${scenario.tone}`} key={scenario.id}>
            <div className="scenario-card-header">
              <div>
                <span className="field-label">{scenario.horizon}</span>
                <h3>{scenario.label}</h3>
              </div>
              <span className={`pill ${scenario.availability === 'blocked' ? 'purple' : scenario.availability === 'advisory' ? 'yellow' : 'green'}`}>
                {scenario.availability}
              </span>
            </div>

            <div className="scenario-kpis" aria-label={`${scenario.label} projected effects`}>
              <span><strong>Cost {rangeLabel(scenario.expectedCostRange)}</strong><small>/100 range</small></span>
              <span><strong>Fatigue {signedRangeLabel(scenario.tomorrowFatigueDeltaRange)}</strong><small>tomorrow range</small></span>
              <span><strong>Lag {rangeLabel(scenario.recoveryLagDaysRange, 'd')}</strong><small>recovery range</small></span>
              <span><strong className={`risk-${riskTone(scenario.performanceRisk)}`}>{scenario.performanceRisk}</strong><small>risk</small></span>
            </div>

            <p className="scenario-risk">{scenario.nextRaceRisk}</p>
            <p>{scenario.consequence}</p>
            <div className="scenario-next">
              <span className="field-label">Next action</span>
              <p>{scenario.nextAction}</p>
            </div>
            {onSelectScenario && (
              <button
                className={selectedScenarioId === scenario.id ? 'selected-action' : 'ghost'}
                type="button"
                disabled={scenario.availability === 'blocked'}
                onClick={() => onSelectScenario(scenario)}
              >
                {selectedScenarioId === scenario.id ? 'Logged for today' : scenario.availability === 'blocked' ? 'Blocked' : 'Log this actual'}
              </button>
            )}
          </article>
        ))}
      </div>

      <div className="scenario-footer">
        <p className="muted-copy">{simulation.disclaimer}</p>
        <p className="muted-copy">Missing signals: {simulation.missingSignals.length ? simulation.missingSignals.join(' · ') : 'none critical'}</p>
      </div>
    </section>
  )
}
