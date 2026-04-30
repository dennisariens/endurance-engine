import { describe, expect, it } from 'vitest'
import { makeDailyDecision } from './decisionEngine'
import type { CurrentState, Race } from '../domain/types'

const baseState: CurrentState = { injury_present: false, illness_present: false, recovery_status: 'green' }
const race = (date: string): Race => ({ id: date, date, name: 'Fixed Race', discipline: 'cycling', priority: 'fixed', mandatory: true })

describe('decisionEngine', () => {
  it('allows fixed race today when no injury or illness', () => {
    const decision = makeDailyDecision({ today: '2026-05-01', races: [race('2026-05-01')], activities: [], state: baseState })
    expect(decision.today).toBe('Race')
  })

  it('switches to damage control when race today and recovery red', () => {
    const decision = makeDailyDecision({ today: '2026-05-01', races: [race('2026-05-01')], activities: [], state: { ...baseState, recovery_status: 'red' } })
    expect(decision.mode).toBe('DamageControl')
  })

  it('blocks race only for injury or illness', () => {
    const decision = makeDailyDecision({ today: '2026-05-01', races: [race('2026-05-01')], activities: [], state: { ...baseState, injury_present: true } })
    expect(decision.today).toBe('Rest')
    expect(decision.status).toBe('InjuryIllness')
  })

  it('preserves freshness the day before a fixed race', () => {
    const decision = makeDailyDecision({ today: '2026-04-30', races: [race('2026-05-01')], activities: [], state: baseState })
    expect(decision.today).toBe('Recovery')
    expect(decision.strengthAllowed).toBe(false)
  })
})
