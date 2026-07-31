import type { Dispatch, SetStateAction } from 'react'
import type { AerionLocalSnapshot } from '../components/DataControlsPanel'
import type { Activity, CurrentState } from '../domain/types'
import { dedupeSyncedActivities } from '../data/integrations/dedupe'
import { parseGarminRecoveryFixture, normalizeGarminRecoveryState } from '../data/integrations/garminRecoveryAdapter'
import { normalizeStravaActivityProofs, type StravaActivityProof } from '../data/integrations/stravaActivityProofAdapter'
import { AERION_LOCAL_STORAGE_SCHEMA_VERSION } from '../lib/storage'

type UseAerionImportsInput = {
  snapshot: Omit<AerionLocalSnapshot, 'exportedAt' | 'version'>
  importSnapshot: (snapshot: AerionLocalSnapshot) => void
  setActivities: Dispatch<SetStateAction<Activity[]>>
  setState: Dispatch<SetStateAction<CurrentState>>
}

export function useAerionImports({ snapshot, importSnapshot, setActivities, setState }: UseAerionImportsInput) {
  const exportLocalData = () => {
    const payload: AerionLocalSnapshot = { version: AERION_LOCAL_STORAGE_SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...snapshot }
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

  const importLocalData = async (file: File) => {
    const parsed = JSON.parse(await file.text()) as AerionLocalSnapshot
    if (![1, AERION_LOCAL_STORAGE_SCHEMA_VERSION].includes(parsed.version) || !Array.isArray(parsed.races) || !Array.isArray(parsed.activities) || !Array.isArray(parsed.goals)) throw new Error('Invalid AERION backup file')
    parsed.goalConversation ??= []
    importSnapshot(parsed)
  }

  const importGarminRecovery = async (file: File) => {
    const snapshots = parseGarminRecoveryFixture(JSON.parse(await file.text()))
    const latest = snapshots.filter((item) => item.date).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] ?? snapshots[0]
    if (!latest) throw new Error('No Garmin recovery snapshots found')
    setState((current) => ({ ...current, ...normalizeGarminRecoveryState(latest) }))
    return { source: 'Garmin', records: snapshots.length, latestDate: latest.date, message: `Imported Garmin recovery snapshot${snapshots.length === 1 ? '' : 's'} from ${file.name}` }
  }

  const importStravaActivities = async (file: File) => {
    const parsed = JSON.parse(await file.text()) as StravaActivityProof[] | { activities?: StravaActivityProof[] }
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.activities) ? parsed.activities : []
    const imported = normalizeStravaActivityProofs(rows)
    if (!imported.length) throw new Error('No Strava activities found')
    setActivities((current) => dedupeSyncedActivities([...current, ...imported]))
    const sortedDates = imported.map((activity) => activity.date).sort()
    const latestDate = sortedDates[sortedDates.length - 1]
    return { source: 'Strava', records: imported.length, latestDate, message: `Imported Strava activity proof from ${file.name}` }
  }

  return {
    exportLocalData,
    importLocalData,
    importGarminRecovery,
    importStravaActivities,
  }
}
