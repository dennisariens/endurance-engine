import type { CurrentState } from '../domain/types'

export type ReadinessSignal = {
  label: 'HRV' | 'Sleep' | 'Resting HR' | 'VO2 max' | 'Body Battery' | 'Stress' | 'Training Readiness' | 'Sleep Score' | 'HRV Status'
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

function highGoodStatus(value: number | null | undefined, yellowBelow: number, redBelow: number): ReadinessSignal['status'] {
  if (value == null) return 'unknown'
  if (value <= redBelow) return 'red'
  if (value <= yellowBelow) return 'yellow'
  return 'green'
}

function lowGoodStatus(value: number | null | undefined, yellowAbove: number, redAbove: number): ReadinessSignal['status'] {
  if (value == null) return 'unknown'
  if (value >= redAbove) return 'red'
  if (value >= yellowAbove) return 'yellow'
  return 'green'
}

function garminHrvStatus(value: string | null | undefined): ReadinessSignal['status'] {
  if (!value) return 'unknown'
  if (/low|poor|strained/i.test(value)) return 'red'
  if (/unbalanced|watch|caution/i.test(value)) return 'yellow'
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
    {
      label: 'Body Battery',
      value: state.garmin_body_battery == null ? 'not synced' : `${state.garmin_body_battery}`,
      status: highGoodStatus(state.garmin_body_battery, 45, 25),
      note: 'Garmin Connect recovery reserve. Low Body Battery should reduce optional training appetite.',
    },
    {
      label: 'Stress',
      value: state.garmin_stress_avg == null ? 'not synced' : `${state.garmin_stress_avg}`,
      status: lowGoodStatus(state.garmin_stress_avg, 40, 55),
      note: 'Garmin Connect stress average. High stress makes the same workout more expensive.',
    },
    {
      label: 'Training Readiness',
      value: state.garmin_training_readiness == null ? 'not synced' : `${state.garmin_training_readiness}`,
      status: highGoodStatus(state.garmin_training_readiness, 50, 35),
      note: 'Garmin readiness score. Useful for modifiers once synced locally.',
    },
    {
      label: 'Sleep Score',
      value: state.garmin_sleep_score == null ? 'not synced' : `${state.garmin_sleep_score}`,
      status: highGoodStatus(state.garmin_sleep_score, 70, 55),
      note: 'Garmin sleep quality score. Complements raw sleep duration.',
    },
    {
      label: 'HRV Status',
      value: state.garmin_hrv_status ?? 'not synced',
      status: garminHrvStatus(state.garmin_hrv_status),
      note: 'Garmin HRV status. Balanced is context; unbalanced/low reinforces caution.',
    },
  ]
}
