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
  garmin_body_battery: 68,
  garmin_stress_avg: 24,
  garmin_training_readiness: 71,
  garmin_sleep_score: 86,
  garmin_hrv_status: 'balanced',
}

describe('buildReadinessSignals', () => {
  it('surfaces HRV, sleep, resting HR and VO2 max when available', () => {
    const signals = buildReadinessSignals(baselineState)

    expect(signals.map((signal) => signal.label)).toEqual(['HRV', 'Sleep', 'Resting HR', 'VO2 max', 'Body Battery', 'Stress', 'Training Readiness', 'Sleep Score', 'HRV Status'])
    expect(signals.find((signal) => signal.label === 'HRV')?.value).toBe('49.2 ms')
    expect(signals.find((signal) => signal.label === 'Sleep')?.value).toBe('7.9 h')
    expect(signals.find((signal) => signal.label === 'Resting HR')?.value).toBe('49.4 bpm')
    expect(signals.find((signal) => signal.label === 'VO2 max')?.value).toBe('58')
    expect(signals.find((signal) => signal.label === 'Body Battery')?.value).toBe('68')
    expect(signals.find((signal) => signal.label === 'Stress')?.value).toBe('24')
    expect(signals.find((signal) => signal.label === 'Training Readiness')?.value).toBe('71')
    expect(signals.find((signal) => signal.label === 'Sleep Score')?.value).toBe('86')
    expect(signals.find((signal) => signal.label === 'HRV Status')?.value).toBe('balanced')
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

  it('flags Garmin biomarker strain conservatively', () => {
    const signals = buildReadinessSignals({
      ...baselineState,
      garmin_body_battery: 22,
      garmin_stress_avg: 58,
      garmin_training_readiness: 31,
      garmin_sleep_score: 52,
      garmin_hrv_status: 'unbalanced',
    })

    expect(signals.find((signal) => signal.label === 'Body Battery')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'Stress')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'Training Readiness')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'Sleep Score')?.status).toBe('red')
    expect(signals.find((signal) => signal.label === 'HRV Status')?.status).toBe('yellow')
  })
})
