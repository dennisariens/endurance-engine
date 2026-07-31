import { useState } from 'react'
import { Activity, CheckCircle2, Database, Download, Gauge, LogOut, Plug, Radio, ShieldCheck, UserRound, Watch } from 'lucide-react'
import { PremiumKpi } from '../ui'
import type { DataHubActionResult, PremiumCommandDeckProps } from '../types'
import type { IntegrationHealth } from '../../../data/integrationHealth'

type Props = PremiumCommandDeckProps

const sourceIcons = {
  intervals: Radio,
  garmin: Watch,
  strava: Activity,
  manual: Database,
} as const

const stateTone: Record<IntegrationHealth['state'], string> = {
  connected: 'green',
  syncing: 'blue',
  local: 'blue',
  'not-connected': 'slate',
  offline: 'yellow',
  error: 'red',
}

function formatState(value: IntegrationHealth['state']): string {
  return value.replace('-', ' ')
}

const sourceRole = {
  intervals: 'Training analytics',
  garmin: 'Recovery truth',
  strava: 'Activity proof',
  manual: 'Founder override',
} as const

const usedFor = {
  intervals: 'load, events, path evidence',
  garmin: 'readiness modifiers',
  strava: 'routes and proof context',
  manual: 'corrections and receipts',
} as const

const garminTemplate = {
  snapshots: [{
    date: '2026-07-27',
    hrvMs: 48,
    hrv7dAvgMs: 51,
    hrvStatus: 'balanced',
    restingHr: 47,
    restingHr14dAvg: 49,
    sleepHours: 7.4,
    sleepScore: 82,
    bodyBattery: 71,
    stressAvg: 29,
    trainingReadiness: 68,
    recoveryScore: 74,
    vo2max: 56,
  }],
}

const stravaTemplate = {
  activities: [{
    id: 123456789,
    name: 'Evening endurance ride',
    sport_type: 'Ride',
    start_date_local: '2026-07-27T18:12:00Z',
    moving_time: 5400,
    distance: 42100,
    suffer_score: 58,
    average_heartrate: 139,
    max_heartrate: 171,
    weighted_average_watts: 218,
    average_watts: 191,
  }],
}

function downloadJson(name: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function SettingsDataScreen({ stats, state, integrations, account, onUpdateAccount, onSyncIntervals, onImportGarminRecovery, onImportStravaActivities, onExportLocalData, onImportLocalData }: Props) {
  const [receipt, setReceipt] = useState<DataHubActionResult | null>(null)
  const connectedCount = integrations.filter((integration) => integration.state === 'connected' || integration.state === 'local').length
  const primaryRecovery = integrations.find((integration) => integration.id === 'garmin')
  const activitiesLoaded = stats.disciplineMix.reduce((sum, row) => sum + row.value, 0)
  const importFile = (file: File | undefined, action: (file: File) => Promise<DataHubActionResult>) => {
    if (!file) return
    action(file)
      .then(setReceipt)
      .catch((error) => window.alert(error instanceof Error ? error.message : 'Import failed'))
  }
  const runAction = (action: () => Promise<DataHubActionResult>) => action().then(setReceipt).catch((error) => window.alert(error instanceof Error ? error.message : 'AERION action failed'))

  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header">
        <p className="eyebrow">Connect</p>
        <h2>Strava, Garmin, Intervals.</h2>
        <p>Connection layer first: Garmin for recovery truth, Strava for completed-proof context, Intervals for load/events. AERION shows the trust boundary and gives direct import/sync controls without leaking browser secrets.</p>
      </div>

      <div className="premium-training-grid paginated-grid">
        <PremiumKpi label="Sources online" value={`${connectedCount} / ${integrations.length}`} detail="Connected/local sources in AERION Core" tone={connectedCount >= 2 ? 'green' : 'yellow'} icon={ShieldCheck} />
        <PremiumKpi label="Activities loaded" value={activitiesLoaded} detail="From local storage and opening sync" tone="blue" icon={Database} />
        <PremiumKpi label="Recovery source" value={state.garmin_training_readiness != null ? 'Garmin-ready' : 'Pending'} detail={primaryRecovery?.detail ?? 'Garmin adapter not configured'} tone={state.garmin_training_readiness != null ? 'green' : 'slate'} icon={Watch} />
        <PremiumKpi label="Account" value={account.status === 'signed-in' ? 'Signed in' : 'Local'} detail={account.localOnly ? 'Local-first profile' : account.email ?? 'Future cloud sync'} tone="slate" icon={UserRound} />
      </div>

      {receipt && <article className="integration-receipt">
        <div className="chart-title"><CheckCircle2 size={15} strokeWidth={1.9} /><span>Latest source receipt</span></div>
        <strong>{receipt.source}: {receipt.records} record{receipt.records === 1 ? '' : 's'} accepted</strong>
        <p>{receipt.message}</p>
        <dl>
          <div><dt>Latest date</dt><dd>{receipt.latestDate ?? 'n/a'}</dd></div>
          <div><dt>Boundary</dt><dd>local adapter / no browser secrets</dd></div>
        </dl>
      </article>}

      <article className="account-control-card">
        <div>
          <div className="chart-title"><UserRound size={15} strokeWidth={1.8} /><span>Account</span></div>
          <h3>{account.status === 'signed-in' ? `${account.displayName} / AERION local account` : 'Local-first profile'}</h3>
          <p>Profile, sign-in state, connection management, export/import, and logout. Backend/cloud auth is not faked; current account state is a persisted local model.</p>
        </div>
        <div className="account-action-grid">
          <button type="button" onClick={() => { onUpdateAccount({ ...account, status: 'signed-in', displayName: account.displayName || 'Dennis', localOnly: true }); setReceipt({ source: 'Account', records: 1, message: 'Local account state set to signed in.' }) }}><UserRound size={14} /> Log in</button>
          <button type="button" className="ghost" onClick={() => { onUpdateAccount({ ...account, status: 'local', localOnly: true }); setReceipt({ source: 'Account', records: 1, message: 'Local account state set to logged out.' }) }}><LogOut size={14} /> Log out</button>
          <button type="button" className="ghost" onClick={() => { onExportLocalData(); setReceipt({ source: 'Manual', records: activitiesLoaded, latestDate: new Date().toISOString().slice(0, 10), message: 'Exported local AERION backup.' }) }}><Database size={14} /> Export data</button>
          <label className="account-file-button"><Gauge size={14} /> Import data<input type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportLocalData(file).then(() => setReceipt({ source: 'AERION backup', records: 1, latestDate: new Date().toISOString().slice(0, 10), message: `Imported local backup from ${file.name}` })).catch((error) => window.alert(error instanceof Error ? error.message : 'Import failed')); event.currentTarget.value = '' }} /></label>
        </div>
      </article>

      <div className="integration-template-row">
        <button type="button" className="ghost" onClick={() => downloadJson('aerion-garmin-recovery-template.json', garminTemplate)}><Download size={13} /> Garmin JSON template</button>
        <button type="button" className="ghost" onClick={() => downloadJson('aerion-strava-proof-template.json', stravaTemplate)}><Download size={13} /> Strava JSON template</button>
      </div>

      <div className="integration-hub-grid">
        {integrations.map((integration) => {
          const Icon = sourceIcons[integration.id]
          return (
            <article key={integration.id} className={`integration-card state-${integration.state}`}>
              <div className="integration-card-header">
                <div>
                  <span className="integration-priority">{integration.priority}</span>
                  <h3><Icon size={18} strokeWidth={1.8} />{integration.name}</h3>
                </div>
                <strong className={`integration-state tone-${stateTone[integration.state]}`}>{formatState(integration.state)}</strong>
              </div>
              <p>{integration.detail}</p>
              <dl>
                <div><dt>Role</dt><dd>{sourceRole[integration.id]}</dd></div>
                <div><dt>Used for</dt><dd>{usedFor[integration.id]}</dd></div>
                <div><dt>Records</dt><dd>{integration.recordCount ?? 'n/a'}</dd></div>
                <div><dt>Last sync</dt><dd>{integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleString() : 'not yet'}</dd></div>
              </dl>
              <footer>
                <span>{integration.nextAction}</span>
                <div className="integration-actions">
                  {integration.id === 'intervals' && <button type="button" onClick={() => runAction(onSyncIntervals)}><Plug size={13} /> Sync now</button>}
                  {integration.id === 'garmin' && <label><Plug size={13} /> Import recovery<input type="file" accept="application/json" onChange={(event) => { importFile(event.target.files?.[0], onImportGarminRecovery); event.currentTarget.value = '' }} /></label>}
                  {integration.id === 'strava' && <label><Plug size={13} /> Import proof<input type="file" accept="application/json" onChange={(event) => { importFile(event.target.files?.[0], onImportStravaActivities); event.currentTarget.value = '' }} /></label>}
                  {integration.id === 'manual' && <button type="button" className="ghost" onClick={() => { onExportLocalData(); setReceipt({ source: 'Manual', records: activitiesLoaded, latestDate: new Date().toISOString().slice(0, 10), message: 'Exported local AERION backup.' }) }}>Export local</button>}
                  <button type="button" className="ghost" onClick={() => setReceipt({ source: integration.name, records: integration.recordCount ?? 0, latestDate: integration.lastSyncedAt?.slice(0, 10), message: `${integration.name} options are local-first: role, trust boundary, import/export, and adapter contract.` })}>Options</button>
                </div>
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}
