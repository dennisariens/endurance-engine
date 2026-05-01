import { describe, expect, it } from 'vitest'
import type { CurrentState } from '../domain/types'
import { buildReadinessSignals } from './readinessSignalEngine'

const baselineState: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'green',
  resting_hr_14d_avg: 49.4,
  hrv_14d_avg: 49.2,
  sleep_hours_14d_avg: 7.9,
  vo2max: 58,
}

describe('buildReadinessSignals', () => {
  it('surfaces HRV, sleep, resting HR and VO2 max when available', () => {
    const signals = buildReadinessSignals(baselineState)

    expect(signals.map((signal) => signal.label)).toEqual(['HRV', 'Sleep', 'Resting HR', 'VO2 max'])
    expect(signals.find((signal) => signal.label === 'HRV')?.value).toBe('49.2 ms')
    expect(signals.find((signal) => signal.label === 'Sleep')?.value).toBe('7.9 h')
    expect(signals.find((signal) => signal.label === 'Resting HR')?.value).toBe('49.4 bpm')
    expect(signals.find((signal) => signal.label === 'VO2 max')?.value).toBe('58')
  })

  it('marks VO2 max as unavailable rather than pretending it is used', () => {
    const signals = buildReadinessSignals({ ...baselineState, vo2max: null })

    const vo2 = signals.find((signal) => signal.label === 'VO2 max')
    expect(vo2?.value).toBe('not synced')
    expect(vo2?.status).toBe('unknown')
    expect(vo2?.note).toContain('not currently driving recommendations')
  })

  it('flags weak recovery signals conservatively', () => {
    const signals = buildReadinessSignals({ ...baselineState, recovery_status: 'red', hrv_14d_avg: 35, sleep_hours_14d_avg: 5.8, resting_hr_14d_avg: 58 })

    expect(signals.find((signal) => signal.label === 'HRV')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'Sleep')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'Resting HR')?.status).toBe('yellow')
  })
})
