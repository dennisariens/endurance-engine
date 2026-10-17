import { describe, expect, it, vi } from 'vitest'
import { buildBriefingPayload } from './aerionApi'
import { useAerionDerivedState } from '../src/hooks/useAerionDerivedState'
import type { CurrentState, Goal } from '../src/domain/types'

vi.mock('react', () => ({ useMemo: (factory: () => unknown) => factory() }))

describe('browser snapshot briefing parity', () => {
  it('uses selected goal and the same daily recommendation orchestration as the browser', async () => {
    const state: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'green', last_updated: '2026-10-16', recovery_score: 0, garmin_training_readiness: 0 }
    const goals: Goal[] = [
      { id: 'first', name: 'Synthetic cycling goal', type: 'fixed-date-race', discipline: 'cycling', status: 'committed', targetDate: '2026-11-01' },
      { id: 'selected', name: 'Synthetic running goal', type: 'fixed-date-race', discipline: 'running', status: 'committed', targetDate: '2026-12-01' },
    ]
    const snapshot = { state, goals, activeGoalId: 'selected', activities: [], races: [], decisionLog: [], syncedAt: '2026-10-16T10:00:00Z' }
    const browser = useAerionDerivedState({ today: '2026-10-16', yesterday: '2026-10-15', ...snapshot, syncStatus: { state: 'fresh', message: 'Synthetic QA', lastSyncedAt: snapshot.syncedAt } })
    const server = await buildBriefingPayload({ date: '2026-10-16', env: {}, snapshot })
    expect(server.ok).toBe(true)
    expect(server.source).toBe('browser-local')
    expect(server.control?.dailyRecommendation).toEqual(browser.dailyRecommendation)
    expect(server.control?.goalReadiness).toEqual(browser.goalReadiness)
    expect(server.control?.next72Plan).toEqual(browser.next72Plan)
  })
  it('refuses conflicting selected goals rather than silently selecting another', async () => {
    const server = await buildBriefingPayload({ date: '2026-10-16', env: {}, snapshot: { state: { injury_present: false, illness_present: false, recovery_status: 'unknown' }, activities: [], races: [], goals: [], activeGoalId: 'missing' } })
    expect(server.ok).toBe(false)
    expect(server.control).toBeUndefined()
  })
})
