import type { AccountSettings, Activity, BlockedDate, CurrentState, DecisionLogEntry, Goal, GoalConversationEntry, Race, Theme, VisualizationSettings } from '../domain/types'

export type AerionLocalSnapshot = {
  exportedAt: string
  version: 1
  races: Race[]
  goals: Goal[]
  goalConversation?: GoalConversationEntry[]
  activities: Activity[]
  blockedDates: BlockedDate[]
  decisionLog: DecisionLogEntry[]
  currentState: CurrentState
  theme: Theme
  account?: AccountSettings
  visualization?: VisualizationSettings
}

type Props = {
  snapshot: Omit<AerionLocalSnapshot, 'exportedAt' | 'version'>
  onImport: (snapshot: AerionLocalSnapshot) => void
  onResetLocalData: () => void
}

export function DataControlsPanel({ snapshot, onImport, onResetLocalData }: Props) {
  const exportData = () => {
    const payload: AerionLocalSnapshot = { version: 1, exportedAt: new Date().toISOString(), ...snapshot }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aerion-local-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const importData = async (file?: File) => {
    if (!file) return
    const parsed = JSON.parse(await file.text()) as AerionLocalSnapshot
    if (parsed.version !== 1 || !Array.isArray(parsed.races) || !Array.isArray(parsed.activities) || !Array.isArray(parsed.goals)) {
      throw new Error('Invalid AERION backup file')
    }
    parsed.goalConversation ??= []
    onImport(parsed)
  }

  return (
    <section className="panel data-controls">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Local data</p>
          <h2>Backup / restore / reset</h2>
        </div>
      </div>
      <p>Exports only local dashboard state. Intervals credentials stay outside the browser and outside this file.</p>
      <div className="button-row">
        <button type="button" onClick={exportData}>Export JSON</button>
        <label className="file-button">
          Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={(event) => {
              importData(event.target.files?.[0]).catch((error) => window.alert(error instanceof Error ? error.message : 'Import failed'))
              event.currentTarget.value = ''
            }}
          />
        </label>
        <button className="ghost danger" type="button" onClick={() => {
          if (window.confirm('Reset AERION local dashboard data to fixtures?')) onResetLocalData()
        }}>Reset local data</button>
      </div>
    </section>
  )
}
