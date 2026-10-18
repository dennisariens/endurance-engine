import type { AerionStateSnapshot } from '../hooks/useAerionState'
import { defaultAccount, defaultState, defaultVisualization } from '../hooks/useAerionState'

export function emptySnapshot(): AerionStateSnapshot {
  return { races: [], goals: [], goalConversation: [], activities: [], blockedDates: [], decisionLog: [], currentState: { ...defaultState }, theme: 'dark', account: { ...defaultAccount }, visualization: structuredClone(defaultVisualization) }
}
export function sameSnapshot(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b) }
/** Full replacement requires explicit action. This summary never exposes raw health values. */
export function differences(a: AerionStateSnapshot | null, b: AerionStateSnapshot) {
  return (Object.keys(b) as (keyof AerionStateSnapshot)[]).filter(key => !sameSnapshot(a?.[key], b[key])).map(key => ({ field: key, before: Array.isArray(a?.[key]) ? (a![key] as unknown[]).length : a ? 'present' : 'empty', after: Array.isArray(b[key]) ? (b[key] as unknown[]).length : 'present' }))
}
export type PendingWrite = { snapshot: AerionStateSnapshot; revision: number; requestId: string }
/** Retain the same request ID and bytes after uncertain network failure. */
export function pendingWrite(prior: PendingWrite | null, snapshot: AerionStateSnapshot, revision: number): PendingWrite {
  if (prior && sameSnapshot(prior.snapshot, snapshot) && prior.revision === revision) return prior
  return { snapshot: structuredClone(snapshot), revision, requestId: crypto.randomUUID() }
}
export function downloadBackup(snapshot: AerionStateSnapshot, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...snapshot, version: 2, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = `aerion-${name}.json`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
