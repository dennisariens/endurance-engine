import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAerionImports } from './useAerionImports'
import type { AerionLocalSnapshot } from '../components/DataControlsPanel'
import { useAerionState } from './useAerionState'

const { setters } = vi.hoisted(() => ({ setters: [] as ReturnType<typeof vi.fn>[] }))
vi.mock('react', () => ({
  useEffect: vi.fn(),
  useState: (initial: unknown) => {
    const setter = vi.fn()
    setters.push(setter)
    return [typeof initial === 'function' ? initial() : initial, setter]
  },
}))

// Synthetic state only: this test never reads browser storage or athlete files.
const snapshot: Omit<AerionLocalSnapshot, 'version' | 'exportedAt'> = {
  races: [], goals: [], activities: [], blockedDates: [], decisionLog: [],
  currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 0 },
  theme: 'dark', account: { status: 'local', displayName: 'Synthetic QA', localOnly: true },
}

afterEach(() => vi.unstubAllGlobals())

describe('restore safety', () => {
  it.each([{ currentState: {} }, { blockedDates: null }, { theme: 'neon' }, { activities: [{}] }])('rejects invalid imports before any callback %j', async invalid => {
    const restore = vi.fn(), setActivities = vi.fn(), setState = vi.fn()
    const imports = useAerionImports({ snapshot, importSnapshot: restore, setActivities, setState })
    await expect(imports.importLocalData(new File([JSON.stringify({ ...snapshot, version: 2, exportedAt: '2026-10-01T00:00:00Z', ...invalid })], 'synthetic.json'))).rejects.toThrow()
    expect(restore).not.toHaveBeenCalled()
    expect(setActivities).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  it('guards the expert/direct state boundary before every setter', () => {
    setters.length = 0
    vi.stubGlobal('localStorage', { getItem: () => null })
    const state = useAerionState()
    expect(() => state.importSnapshot({ ...snapshot, theme: 'neon' } as never)).toThrow()
    expect(setters.every(setter => setter.mock.calls.length === 0)).toBe(true)
    expect(() => state.importSnapshot({ ...snapshot, version: 999 } as never)).toThrow()
    expect(setters.every(setter => setter.mock.calls.length === 0)).toBe(true)
  })

  it('replaces rather than merges and resets absent optional preferences', () => {
    setters.length = 0
    vi.stubGlobal('localStorage', { getItem: () => null })
    const state = useAerionState()
    state.importSnapshot({ ...snapshot, account: undefined })
    // Every setter receives a replacement value, never a sync updater function.
    expect(setters).toHaveLength(11)
    for (const setter of setters) {
      expect(setter).toHaveBeenCalledOnce()
      expect(typeof setter.mock.calls[0][0]).not.toBe('function')
    }
    expect(setters[4]).toHaveBeenCalledWith([])
    expect(setters[8]).toHaveBeenCalledWith({ status: 'local', displayName: 'Athlete', localOnly: true })
    expect(setters[10]).toHaveBeenCalledWith(snapshot.currentState)
  })
})

describe('isolated backup round trip', () => {
  it('exports synthetic state and restores it through the import callback, preserving zero', async () => {
    let exported: Blob | undefined
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
    const revoke = vi.fn()
    vi.stubGlobal('document', { createElement: () => link, body: { appendChild: vi.fn() } })
    vi.stubGlobal('URL', { createObjectURL: (blob: Blob) => { exported = blob; return 'blob:synthetic-qa' }, revokeObjectURL: revoke })
    const restore = vi.fn()
    const imports = useAerionImports({ snapshot, importSnapshot: restore, setActivities: vi.fn(), setState: vi.fn() })
    imports.exportLocalData()
    expect(link.click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:synthetic-qa')
    expect(link.download).toMatch(/^aerion-local-backup-.*\.json$/)
    const json = await exported!.text()
    await imports.importLocalData(new File([json], 'synthetic-backup.json', { type: 'application/json' }))
    expect(restore).toHaveBeenCalledOnce()
    expect(restore.mock.calls[0][0]).toMatchObject({ ...snapshot, version: 2, goalConversation: [] })
    expect(restore.mock.calls[0][0].currentState.recovery_score).toBe(0)
  })

  it('rejects unsupported backup versions without invoking restore', async () => {
    const restore = vi.fn()
    const imports = useAerionImports({ snapshot, importSnapshot: restore, setActivities: vi.fn(), setState: vi.fn() })
    await expect(imports.importLocalData(new File([JSON.stringify({ ...snapshot, version: 999 })], 'unsupported.json'))).rejects.toThrow('Invalid AERION backup file')
    expect(restore).not.toHaveBeenCalled()
  })
})
