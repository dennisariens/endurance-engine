import { describe, expect, it } from 'vitest'
import { daysBetween, detectRaceBlock, getNextRace } from './calendarEngine'
import type { Race } from '../domain/types'

const race = (date: string): Race => ({ id: date, date, name: date, discipline: 'cycling', priority: 'fixed', mandatory: true })

describe('calendarEngine', () => {
  it('calculates day distance', () => {
    expect(daysBetween('2026-04-30', '2026-05-01')).toBe(1)
  })

  it('finds next race', () => {
    expect(getNextRace([race('2026-05-12'), race('2026-05-01')], '2026-04-30')?.date).toBe('2026-05-01')
  })

  it('detects two races within 72h as race block', () => {
    expect(detectRaceBlock([race('2026-05-01'), race('2026-05-03')], '2026-05-01').active).toBe(true)
  })

  it('detects three races within seven days as race block', () => {
    expect(detectRaceBlock([race('2026-05-01'), race('2026-05-05'), race('2026-05-07')], '2026-05-01').active).toBe(true)
  })
})
