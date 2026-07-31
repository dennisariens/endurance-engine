import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Activity, CurrentState, Race } from '../domain/types'
import { dedupeSyncedActivities, mergeRacesByStableId } from '../data/integrations/dedupe'
import { fetchOpeningSync, type SyncStatus } from '../lib/dataSync'

type UseOpeningSyncInput = {
  setActivities: Dispatch<SetStateAction<Activity[]>>
  setRaces: Dispatch<SetStateAction<Race[]>>
  setState: Dispatch<SetStateAction<CurrentState>>
}

export function useOpeningSync({ setActivities, setRaces, setState }: UseOpeningSyncInput) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle', message: 'Opening sync not started yet.' })

  const applySyncPayload = (payload: Awaited<ReturnType<typeof fetchOpeningSync>>) => {
    if (payload.ok && payload.activities) {
      setActivities((current) => dedupeSyncedActivities([...current, ...payload.activities ?? []]))
      if (payload.races?.length) setRaces((current) => mergeRacesByStableId(current, payload.races ?? []))
      if (payload.state) setState((current) => ({ ...current, ...payload.state }))
      setSyncStatus({ state: 'fresh', message: payload.message, lastSyncedAt: payload.syncedAt, activityCount: payload.activities.length, raceCount: payload.races?.length ?? 0 })
      return { source: 'Intervals', records: payload.activities.length + (payload.races?.length ?? 0), latestDate: payload.syncedAt?.slice(0, 10), message: payload.message }
    }
    setSyncStatus({ state: payload.source === 'unavailable' ? 'offline' : 'error', message: payload.message, lastSyncedAt: payload.syncedAt })
    return { source: 'Intervals', records: 0, latestDate: payload.syncedAt?.slice(0, 10), message: payload.message }
  }

  const runOpeningSync = async () => {
    setSyncStatus({ state: 'syncing', message: 'Connecting AERION Core and syncing Intervals.icu.' })
    try {
      return applySyncPayload(await fetchOpeningSync())
    } catch (error) {
      const message = `No opening sync available: ${error instanceof Error ? error.message : 'unknown error'}`
      setSyncStatus({ state: 'offline', message })
      return { source: 'Intervals', records: 0, message }
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchOpeningSync()
      .then((payload) => {
        if (!cancelled) applySyncPayload(payload)
      })
      .catch((error) => {
        if (!cancelled) setSyncStatus({ state: 'offline', message: `No opening sync available: ${error instanceof Error ? error.message : 'unknown error'}` })
      })
    return () => { cancelled = true }
  }, [])

  return { syncStatus, runOpeningSync }
}
