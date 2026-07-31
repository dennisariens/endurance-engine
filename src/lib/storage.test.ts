import { afterEach, describe, expect, it, vi } from 'vitest'
import { AERION_LOCAL_STORAGE_SCHEMA_KEY, AERION_LOCAL_STORAGE_SCHEMA_VERSION, loadLocal, saveLocal } from './storage'

function installLocalStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
      clear: () => { store.clear() },
    },
  })
  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('versioned AERION localStorage', () => {
  it('reads v1 raw JSON values and wraps them as v2 on next save', () => {
    const store = installLocalStorage({ 'aerion:theme': JSON.stringify('light') })

    expect(loadLocal('aerion:theme', 'dark')).toBe('light')
    saveLocal('aerion:theme', 'dark')

    expect(store.get(AERION_LOCAL_STORAGE_SCHEMA_KEY)).toBe(String(AERION_LOCAL_STORAGE_SCHEMA_VERSION))
    expect(JSON.parse(store.get('aerion:theme') ?? '{}')).toMatchObject({
      schemaVersion: AERION_LOCAL_STORAGE_SCHEMA_VERSION,
      migratedFrom: 1,
      value: 'dark',
    })
  })

  it('guards future schema envelopes without deleting user-owned data', () => {
    const futurePayload = { schemaVersion: 999, value: ['future-race'], savedAt: '2026-07-31T00:00:00.000Z' }
    const store = installLocalStorage({ 'aerion:races': JSON.stringify(futurePayload) })

    expect(loadLocal('aerion:races', ['fallback'])).toEqual(['fallback'])
    expect(JSON.parse(store.get('aerion:races') ?? '{}')).toEqual(futurePayload)
  })

  it('falls back safely on corrupt JSON without throwing', () => {
    installLocalStorage({ 'aerion:activities': '{not-json' })

    expect(loadLocal('aerion:activities', [])).toEqual([])
  })
})
