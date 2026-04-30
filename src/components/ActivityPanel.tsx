import type { Activity } from '../domain/types'
import { estimateRaceCost } from '../engine/raceCostEngine'

type ActivityPanelProps = { activities: Activity[] }

export function ActivityPanel({ activities }: ActivityPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Recent load</p>
          <h2>Race cost ledger</h2>
        </div>
      </div>
      <div className="activity-list">
        {[...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((activity) => {
          const cost = estimateRaceCost(activity)
          return (
            <div className="activity-row" key={activity.id}>
              <div>
                <strong>{activity.name}</strong>
                <p>{activity.date} · {activity.type} · load {activity.load ?? 'n/a'}</p>
              </div>
              <span className={`pill ${cost.band.toLowerCase()}`}>{cost.score} / {cost.band}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
