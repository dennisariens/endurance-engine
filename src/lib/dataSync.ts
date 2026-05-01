import type { Activity, CurrentState } from '../domain/types'

export type SyncStatus = {
  state: 'idle' | 'syncing' | 'fresh' | 'offline' | 'error'
  message: string
  lastSyncedAt?: string
  activityCount?: number
}

export type SyncPayload = {
  ok: boolean
  source: 'intervals' | 'fixture' | 'unavailable'
  message: string
  syncedAt?: string
  activities?: Activity[]
  state?: Partial<CurrentState>
}

export async function fetchOpeningSync(): Promise<SyncPayload> {
  const response = await fetch('/api/sync', { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    return { ok: false, source: 'unavailable', message: `sync endpoint returned ${response.status}` }
  }
  return await response.json() as SyncPayload
}
