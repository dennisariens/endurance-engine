import type { Activity, DecisionLogEntry } from '../domain/types'
import type { CanonicalAthleteState } from '../state/canonicalAthleteState'
import type { TrajectoryEngineOutput } from './trajectoryEngine'

export type LearningSignal = {
  id: string
  label: string
  direction: 'reinforce' | 'caution' | 'watch'
  confidence: number
  evidenceIds: string[]
  observation: string
  nextAdjustment: string
}

export type LearningEngineOutput = {
  engineVersion: string
  sampleSize: {
    activities: number
    decisions: number
    evidence: number
  }
  behaviourModel: {
    completionRate?: number
    overreachTendency?: number
    underrunTendency?: number
    confidence: number
  }
  signals: LearningSignal[]
  recommendedPolicyAdjustments: string[]
  notes: string[]
}

export const LEARNING_ENGINE_VERSION = 'learning-engine-v1'

function isoDate(value?: string): string | undefined {
  return value?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
}

function daysBetween(start: string, end: string): number {
  return Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86_400_000)
}

function recentActivities(activities: Activity[], today: string, days: number): Activity[] {
  return activities.filter((activity) => {
    const date = isoDate(activity.date)
    if (!date) return false
    const age = daysBetween(date, today)
    return age >= 0 && age < days
  })
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100))
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
}

export function buildLearningEngine(input: {
  today: string
  activities: Activity[]
  decisions: DecisionLogEntry[]
  athleteState: CanonicalAthleteState
  trajectory?: TrajectoryEngineOutput
}): LearningEngineOutput {
  const { today, activities, decisions, athleteState, trajectory } = input
  const recent = recentActivities(activities, today, 28)
  const highLoad = recent.filter((activity) => (activity.load ?? 0) >= 80)
  const loggedRest = decisions.filter((entry) => entry.action === 'rested' || entry.action === 'scenario-rest')
  const completedOnRest = loggedRest.filter((entry) => recent.some((activity) => isoDate(activity.date) === entry.date && (activity.load ?? 0) > 20))
  const completionRate = athleteState.behaviour.completionRate ?? (recent.length ? clamp01(recent.length / 16) : undefined)
  const overreachTendency = loggedRest.length ? clamp01(completedOnRest.length / loggedRest.length) : highLoad.length ? clamp01(highLoad.length / Math.max(1, recent.length)) : undefined
  const underrunTendency = decisions.length ? clamp01(decisions.filter((entry) => entry.action === 'rested').length / decisions.length) : undefined
  const confidence = clamp01(((recent.length >= 8 ? 0.42 : 0.22) + (decisions.length >= 4 ? 0.26 : 0.08) + athleteState.behaviour.confidence) / 1.68)
  const evidenceIds = athleteState.evidenceSummary.includedEvidenceIds.slice(0, 8)
  const signals: LearningSignal[] = []

  if ((overreachTendency ?? 0) >= 0.3) {
    signals.push({
      id: 'behaviour:overreach-rest-days',
      label: 'Rest-day overreach',
      direction: 'caution',
      confidence,
      evidenceIds,
      observation: 'Logged rest/easy choices are often followed by completed load.',
      nextAdjustment: 'When rest is selected, make the next 24h recovery guardrails stricter and explain the trade-off plainly.',
    })
  }

  const avgHighLoad = average(highLoad.map((activity) => activity.load ?? 0))
  if (avgHighLoad && avgHighLoad >= 90) {
    signals.push({
      id: 'load:high-cost-clustering',
      label: 'High-cost clustering',
      direction: 'caution',
      confidence: Math.max(0.25, confidence),
      evidenceIds,
      observation: `${highLoad.length} recent high-load session(s), average load ${avgHighLoad}.`,
      nextAdjustment: 'Bias the next recovery recommendation toward capped easy work until readiness clears.',
    })
  }

  if (trajectory?.direction === 'improving' && athleteState.recovery.status === 'green') {
    signals.push({
      id: 'trajectory:green-build-window',
      label: 'Green build window',
      direction: 'reinforce',
      confidence: Math.min(0.9, confidence + 0.15),
      evidenceIds: trajectory.evidenceIds.slice(0, 8),
      observation: 'Trajectory and recovery state support controlled progression.',
      nextAdjustment: 'Keep progression aerobic and low-drama; caps remain ceilings.',
    })
  }

  if (!signals.length) {
    signals.push({
      id: 'learning:insufficient-pattern-density',
      label: 'Pattern density low',
      direction: 'watch',
      confidence,
      evidenceIds,
      observation: 'Not enough repeated behaviour to personalize strongly yet.',
      nextAdjustment: 'Keep recommendations conservative and collect more actual-completed evidence.',
    })
  }

  const recommendedPolicyAdjustments = signals.map((signal) => signal.nextAdjustment)

  return {
    engineVersion: LEARNING_ENGINE_VERSION,
    sampleSize: {
      activities: recent.length,
      decisions: decisions.length,
      evidence: athleteState.evidenceSummary.includedEvidenceIds.length,
    },
    behaviourModel: {
      completionRate,
      overreachTendency,
      underrunTendency,
      confidence,
    },
    signals,
    recommendedPolicyAdjustments,
    notes: [
      'Learning is advisory; it changes future explanation bias, not historical truth.',
      'Actual completed work remains canonical evidence.',
    ],
  }
}
