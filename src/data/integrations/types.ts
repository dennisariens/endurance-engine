import type { Activity, CurrentState, Race } from '../../domain/types'
import type { RawHealthSample } from '../healthDataAdapter'

export type IntegrationAdapterId = 'intervals' | 'garmin' | 'strava'

export type IntegrationSyncScope = 'activities' | 'events' | 'recovery' | 'activity-proof'

export type IntegrationAdapterDescriptor = {
  id: IntegrationAdapterId
  displayName: string
  scopes: IntegrationSyncScope[]
  serverOnly: boolean
  secretPolicy: 'no-client-secrets'
  role: 'primary-training-load' | 'recovery-snapshot' | 'activity-proof'
}

export type AdapterSyncResult = {
  activities?: Activity[]
  races?: Race[]
  state?: Partial<CurrentState>
  healthSamples?: RawHealthSample[]
}

export type RecoverySnapshotAdapter<TSnapshot> = {
  descriptor: IntegrationAdapterDescriptor
  normalizeSnapshot(snapshot: TSnapshot): RawHealthSample
  normalizeState?(snapshot: TSnapshot): Partial<CurrentState>
}

export type ActivityProofAdapter<TActivity> = {
  descriptor: IntegrationAdapterDescriptor
  normalizeActivities(rows: TActivity[]): Activity[]
}

export type TrainingLoadAdapter<TActivity, TEvent, TWellness> = ActivityProofAdapter<TActivity> & {
  normalizeEvents(rows: TEvent[]): Race[]
  normalizeWellness(rows: TWellness[]): Partial<CurrentState>
}
