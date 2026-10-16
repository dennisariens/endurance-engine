import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAerionImports } from './useAerionImports'
import type { AerionLocalSnapshot } from '../components/DataControlsPanel'

// Synthetic state only: this test never reads browser storage or athlete files.
const snapshot: Omit<AerionLocalSnapshot, 'version' | 'exportedAt'> = {
  races: [], goals: [], activities: [], blockedDates: [], decisionLog: [],
  currentState: { injury_present: false, illness_present: false, recovery_status: 'unknown', recovery_score: 0 },
  theme: 'dark', account: { status: 'local', displayName: 'Synthetic QA', localOnly: true },
}

afterEach(() => vi.unstubAllGlobals())

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
