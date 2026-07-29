import type { CurrentState } from '../domain/types'
import type { ActualOverride } from './actualOverrideEngine'
import { buildReadinessSignals, type ReadinessSignal } from './readinessSignalEngine'

export type MorningVerdict = 'Proceed' | 'Modify' | 'Recover'
export type ForwardReadinessState = 'clear' | 'hold' | 'extend'

export type MorningReadinessVerdict = {
  date: string
  verdict: MorningVerdict
  forwardState: ForwardReadinessState
  tone: 'green' | 'yellow' | 'red'
  headline: string
  primaryAction: string
  reasons: string[]
  signals: ReadinessSignal[]
  yesterdaySummary: string
}

type Input = {
  today: string
  state: CurrentState
  yesterdayOverride?: ActualOverride
}

const signalWeight: Record<ReadinessSignal['status'], number> = {
  green: 0,
  unknown: 1,
  yellow: 2,
  red: 4,
}

function readinessDebt(signals: ReadinessSignal[]): number {
  const labels = new Set(['Body Battery', 'Stress', 'Training Readiness', 'Sleep Score', 'HRV Status', 'HRV', 'Sleep', 'Resting HR'])
  return signals
    .filter((signal) => labels.has(signal.label))
    .reduce((score, signal) => score + signalWeight[signal.status], 0)
}

function yesterdayDebt(override?: ActualOverride): number {
  if (!override || override.authoritativeSource !== 'completed-activity') return 0
  if (override.severity === 'red') return 7
  if (override.severity === 'yellow') return 3
  if (override.status === 'actual-overrides-log') return 2
  return 0
}

function buildReasons(signals: ReadinessSignal[], override: ActualOverride | undefined, totalDebt: number): string[] {
  const reasons: string[] = []
  if (override?.authoritativeSource === 'completed-activity') {
    reasons.push(`yesterday actual is canonical: ${override.deltaSummary}`)
  } else {
    reasons.push('No completed activity debt carried from yesterday.')
  }

  const redSignals = signals.filter((signal) => signal.status === 'red' && signal.label !== 'VO2 max').map((signal) => signal.label)
  const yellowSignals = signals.filter((signal) => signal.status === 'yellow' && signal.label !== 'VO2 max').map((signal) => signal.label)
  if (redSignals.length) reasons.push(`Red readiness signals: ${redSignals.join(', ')}.`)
  if (!redSignals.length && yellowSignals.length) reasons.push(`Caution readiness signals: ${yellowSignals.join(', ')}.`)
  if (!redSignals.length && !yellowSignals.length) reasons.push('Garmin/readiness stack is supportive enough for controlled work.')
  reasons.push(`Composite morning debt: ${totalDebt}.`)
  return reasons
}

export function buildMorningReadinessVerdict({ today, state, yesterdayOverride }: Input): MorningReadinessVerdict {
  const signals = buildReadinessSignals(state)
  const totalDebt = readinessDebt(signals) + yesterdayDebt(yesterdayOverride)
  const hasInjuryBlock = state.injury_present || state.illness_present || state.recovery_status === 'red'
  const verdict: MorningVerdict = hasInjuryBlock || totalDebt >= 16
    ? 'Recover'
    : totalDebt >= 7
      ? 'Modify'
      : 'Proceed'
  const forwardState: ForwardReadinessState = verdict === 'Recover' ? 'extend' : verdict === 'Modify' ? 'hold' : 'clear'
  const tone = verdict === 'Recover' ? 'red' : verdict === 'Modify' ? 'yellow' : 'green'

  return {
    date: today,
    verdict,
    forwardState,
    tone,
    headline: verdict === 'Recover'
      ? 'Recovery remains active. Yesterday has not cleared.'
      : verdict === 'Modify'
        ? 'Proceed only with modifications. Readiness is usable, not generous.'
        : 'Proceed. Morning readiness clears the forward restriction.',
    primaryAction: verdict === 'Recover'
      ? 'Recovery day: rest, walk, mobility, or Z1 only if the body stops filing complaints.'
      : verdict === 'Modify'
        ? 'Modify: keep work easy, short, capped, and readiness-led.'
        : 'Proceed: controlled aerobic work is allowed; caps remain ceilings, not targets.',
    reasons: buildReasons(signals, yesterdayOverride, totalDebt),
    signals,
    yesterdaySummary: yesterdayOverride?.actualSummary ?? 'No yesterday actual override available.',
  }
}
