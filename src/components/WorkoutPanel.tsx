import type { WorkoutOption, WorkoutRecommendation } from '../domain/types'

type Props = { recommendation: WorkoutRecommendation }

function WorkoutCard({ label, option }: { label: string; option?: WorkoutOption }) {
  if (!option) return null
  return (
    <article className="workout-card">
      <div className="workout-title-row">
        <div>
          <p className="eyebrow">{label}</p>
          <h3>{option.title}</h3>
        </div>
        <span className={`pill ${option.intensity === 'race' ? 'red' : option.intensity === 'opener' ? 'yellow' : option.intensity === 'rest' ? 'slate' : 'green'}`}>
          {option.durationMin ? `${option.durationMin} min` : 'off'}
        </span>
      </div>
      <p>{option.purpose}</p>
      <div className="workout-caps">
        {option.hrCap && <span className="pill blue">HR ≤ {option.hrCap}</span>}
        {option.powerCap && <span className="pill cyan">Power ≤ {option.powerCap} W</span>}
        <span className="pill slate">{option.intensity}</span>
      </div>
      <ol>
        {option.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <ul className="cautions">
        {option.cautions.map((caution) => <li key={caution}>{caution}</li>)}
      </ul>
    </article>
  )
}

export function WorkoutPanel({ recommendation }: Props) {
  return (
    <section className="panel workout-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Suggested work</p>
          <h2>If you do want to do something today</h2>
        </div>
      </div>
      <div className="goal-callout">
        <strong>{recommendation.goalReminder}</strong>
        <p>{recommendation.longTermBias}</p>
      </div>
      <div className="workout-grid">
        <WorkoutCard label="Primary" option={recommendation.primary} />
        <WorkoutCard label="Bike option" option={recommendation.bike} />
        <WorkoutCard label="Run option" option={recommendation.run} />
      </div>
    </section>
  )
}
