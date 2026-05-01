import type { CurrentState } from '../domain/types'

export type ReadinessSignal = {
  label: 'HRV' | 'Sleep' | 'Resting HR' | 'VO2 max'
  value: string
  status: 'green' | 'yellow' | 'red' | 'unknown'
  note: string
}

function statusFromRecovery(state: CurrentState): 'green' | 'yellow' | 'red' | 'unknown' {
  if (state.recovery_status === 'green' || state.recovery_status === 'yellow' || state.recovery_status === 'red') return state.recovery_status
  return 'unknown'
}

function hrvStatus(value: number | null | undefined, state: CurrentState): ReadinessSignal['status'] {
  if (value == null) return 'unknown'
  if (value < 40 || state.recovery_status === 'red') return 'red'
  if (value < 45 || state.recovery_status === 'yellow') return 'yellow'
  return 'green'
}

function sleepStatus(value: number | null | undefined, state: CurrentState): ReadinessSignal['status'] {
  if (value == null) return 'unknown'
  if (value < 6.25 || state.recovery_status === 'red') return 'red'
  if (value < 7 || state.recovery_status === 'yellow') return 'yellow'
  return 'green'
}

function restingHrStatus(value: number | null | undefined, state: CurrentState): ReadinessSignal['status'] {
  if (value == null) return 'unknown'
  if (value >= 60 || state.recovery_status === 'red') return value >= 60 ? 'red' : 'yellow'
  if (value >= 55 || state.recovery_status === 'yellow') return 'yellow'
  return 'green'
}

export function buildReadinessSignals(state: CurrentState): ReadinessSignal[] {
  return [
    {
      label: 'HRV',
      value: state.hrv_14d_avg == null ? 'not synced' : `${state.hrv_14d_avg} ms`,
      status: hrvStatus(state.hrv_14d_avg, state),
      note: 'Used as a readiness/trend signal. Low HRV reinforces recovery-first decisions.',
    },
    {
      label: 'Sleep',
      value: state.sleep_hours_14d_avg == null ? 'not synced' : `${state.sleep_hours_14d_avg} h`,
      status: sleepStatus(state.sleep_hours_14d_avg, state),
      note: 'Used as a readiness/trend signal. Poor sleep lowers tolerance for optional load.',
    },
    {
      label: 'Resting HR',
      value: state.resting_hr_14d_avg == null ? 'not synced' : `${state.resting_hr_14d_avg} bpm`,
      status: restingHrStatus(state.resting_hr_14d_avg, state),
      note: 'Used as a readiness/trend signal. Elevated RHR makes hard work more expensive.',
    },
    {
      label: 'VO2 max',
      value: state.vo2max == null ? 'not synced' : `${state.vo2max}`,
      status: state.vo2max == null ? 'unknown' : statusFromRecovery(state),
      note: state.vo2max == null
        ? 'VO2 max is displayed when available, but not currently driving recommendations.'
        : 'Displayed as context only. AERION currently prioritizes recovery, race density, HR caps and race cost.',
    },
  ]
}
