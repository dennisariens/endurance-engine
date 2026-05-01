import type { SyncStatus } from '../lib/dataSync'

type Props = {
  status: SyncStatus
  today: string
}

export function SyncStatusPanel({ status, today }: Props) {
  const tone = status.state === 'fresh' ? 'green' : status.state === 'syncing' ? 'blue' : status.state === 'offline' ? 'yellow' : status.state === 'error' ? 'red' : 'slate'
  return (
    <section className="panel sync-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Opening sync</p>
          <h2>Today is {today}</h2>
        </div>
        <span className={`pill ${tone}`}>{status.state}</span>
      </div>
      <p>{status.message}</p>
      <div className="sync-meta">
        {status.lastSyncedAt && <span className="pill slate">last sync {new Date(status.lastSyncedAt).toLocaleString()}</span>}
        {typeof status.activityCount === 'number' && <span className="pill blue">{status.activityCount} activities loaded</span>}
        {typeof status.raceCount === 'number' && <span className="pill red">{status.raceCount} races loaded</span>}
      </div>
    </section>
  )
}
