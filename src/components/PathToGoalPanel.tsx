import type { GoalReadinessResult } from '../engine/goalReadinessEngine'
import type { PathToGoal } from '../engine/pathEngine'

const confidenceTone = (confidence: GoalReadinessResult['confidence']) => confidence === 'high' ? 'green' : confidence === 'medium' ? 'yellow' : 'slate'

export function PathToGoalPanel({ readiness, path }: { readiness?: GoalReadinessResult; path?: PathToGoal }) {
  if (!readiness || !path) {
    return (
      <section className="panel path-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">PATH TO GOAL</p>
            <h2>No active goal loaded</h2>
            <p>Add a race, candidate event, or floating endurance goal to start readiness tracking.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="panel path-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">PATH TO GOAL</p>
          <h2>{readiness.goalName}</h2>
          <p>{readiness.statusLabel}. {readiness.predictionSummary}. Predictions are ranges, not certainty.</p>
        </div>
        <div className="path-score">
          <span className="field-label">Readiness</span>
          <strong>{readiness.overallReadiness}%</strong>
          <span className={`pill ${confidenceTone(readiness.confidence)}`}>Confidence: {readiness.confidence}</span>
        </div>
      </div>

      <div className="path-grid">
        <article className="path-card highlight">
          <span className="field-label">Prediction range</span>
          <strong>Finish: {readiness.predictedPerformance.finish}%</strong>
          <p>Strong finish: {readiness.predictedPerformance.strongFinish}%</p>
          <p>Performance goal: {readiness.predictedPerformance.performanceGoal}%</p>
          <p>Ready to commit: {readiness.readyToCommit ? 'yes' : 'no'}</p>
        </article>

        <article className="path-card">
          <span className="field-label">Main limiter</span>
          <strong>{readiness.mainLimiter}</strong>
          <p>{readiness.commitmentAdvice}</p>
        </article>

        <article className="path-card">
          <span className="field-label">Phase</span>
          <strong>{path.phase}</strong>
          <p>{readiness.nextRecommendedPhase}</p>
          {path.overrideReason && <p>{path.overrideReason}</p>}
        </article>
      </div>

      <div className="path-columns">
        <div>
          <span className="field-label">Next 14–21 days focus</span>
          <ul>{path.nextFocus.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <span className="field-label">Suggested structure</span>
          <ul>{path.suggestedStructure.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <span className="field-label">Constraints</span>
          <ul>{path.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <span className="field-label">Avoid</span>
          <ul>{path.avoid.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>

      <div className="scenario-grid">
        {[readiness.scenarios.currentTrend, readiness.scenarios.recommendedPlan, readiness.scenarios.overload].map((scenario) => (
          <article key={scenario.label} className="scenario-card">
            <span className="field-label">{scenario.label}</span>
            <strong>{scenario.outcome}</strong>
            <p>{scenario.risk}</p>
          </article>
        ))}
      </div>

      <details className="why-box">
        <summary>Readiness dimensions and evidence</summary>
        <div className="dimension-grid">
          {readiness.dimensions.map((dimension) => (
            <div key={dimension.label} className="dimension-row">
              <span>{dimension.label}</span>
              <strong>{dimension.score}%</strong>
              <p>{dimension.note}</p>
            </div>
          ))}
        </div>
        <ul>
          {[...readiness.evidence, ...path.adaptationNotes].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </section>
  )
}
