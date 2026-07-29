import type { CurrentState, DailyDecision, RaceCostBand, WorkoutRecommendation } from '../domain/types'
import type { GoalReadinessResult } from './goalReadinessEngine'
import type { MorningReadinessVerdict } from './morningReadinessEngine'
import type { Next72Plan } from './recoveryPlanEngine'

type CoachTone = 'green' | 'yellow' | 'red' | 'purple' | 'blue'

export type CoachReadinessAdjustment = {
  state: MorningReadinessVerdict['forwardState']
  changed: string
  why: string
  safeNextAction: string
  consequence: string
}

export type CoachBriefing = {
  headline: string
  status: string
  recommendation: string
  consequence: string
  nextAction: string
  confidence: GoalReadinessResult['confidence'] | 'medium'
  tone: CoachTone
  dominantConstraint: string
  missingSignals: string[]
  readinessAdjustment?: CoachReadinessAdjustment
}

function toneForDecision(decision: DailyDecision): CoachTone {
  if (decision.status === 'InjuryIllness') return 'purple'
  if (decision.status === 'Red') return 'red'
  if (decision.status === 'Yellow') return 'yellow'
  if (decision.today === 'Race') return 'blue'
  return 'green'
}

function raceCostLabel(state: CurrentState): string {
  const score = state.latest_race_cost
  const band: RaceCostBand | undefined | null = state.latest_race_cost_band
  if (typeof score === 'number' && band) return `${score} / ${band}`
  if (band) return band
  return 'not synced'
}

function missingSignals(state: CurrentState): string[] {
  const missing: string[] = []
  if (state.recovery_score == null) missing.push('recovery score')
  if (!state.hrv_trend || state.hrv_trend === 'unknown') missing.push('HRV trend')
  if (state.garmin_body_battery == null) missing.push('Body Battery')
  if (state.garmin_training_readiness == null) missing.push('Training Readiness')
  if (state.sleep_score == null && state.garmin_sleep_score == null) missing.push('sleep score')
  return missing
}

function dominantConstraint(decision: DailyDecision, state: CurrentState, readiness?: GoalReadinessResult): string {
  if (decision.status === 'InjuryIllness') return 'injury / illness block'
  if (decision.status === 'Red') return `recovery debt · race cost ${raceCostLabel(state)}`
  if (decision.raceBlock.active) return decision.raceBlock.reason
  if (typeof decision.daysUntilNextRace === 'number' && decision.daysUntilNextRace <= 3) return 'race proximity'
  if (readiness?.mainLimiter) return readiness.mainLimiter
  return 'controlled aerobic build'
}

function buildConsequence(decision: DailyDecision, state: CurrentState, plan: Next72Plan): string {
  if (decision.status === 'InjuryIllness') return 'If you train anyway, the likely outcome is a longer reset and lower race availability.'
  if (decision.status === 'Red') return 'If you add intensity, tomorrow’s recovery debt likely extends and the next fixed race starts compromised.'
  if (decision.mode === 'DamageControl' || decision.raceBlock.active) return 'If you chase fitness today, freshness for the fixed race is the thing you spend.'
  if (plan.risk === 'High' || plan.risk === 'Extreme') return 'If you stack load now, adaptation becomes cleanup. Tedious, but physiologically difficult to out-argue.'
  return 'If you exceed the cap, the cost is not today’s workout; it is the next 48–72h recovery budget.'
}

function buildReadinessAdjustment(morningReadiness: MorningReadinessVerdict | undefined, plan: Next72Plan): CoachReadinessAdjustment | undefined {
  if (!morningReadiness) return undefined
  const state = morningReadiness.forwardState
  if (state === 'extend') {
    return {
      state,
      changed: 'Morning readiness moved today and the next 24h into recovery-first mode.',
      why: `${morningReadiness.headline} ${morningReadiness.reasons.slice(0, 2).join(' ')}`.trim(),
      safeNextAction: 'Rest, walk, mobility, or capped Z1 only if the body starts cooperating.',
      consequence: 'Ignoring it likely extends recovery lag before the next fixed race and spends freshness you cannot buy back later.',
    }
  }
  if (state === 'hold') {
    return {
      state,
      changed: 'Morning readiness held optional work and removed intensity/strength from the near-term plan.',
      why: `${morningReadiness.headline} ${morningReadiness.reasons.slice(0, 2).join(' ')}`.trim(),
      safeNextAction: 'Keep movement easy and short; stop if HR, legs, or stress signals deteriorate.',
      consequence: 'Forcing intensity now turns a manageable yellow signal into a longer cleanup window.',
    }
  }
  return {
    state,
    changed: 'Morning readiness did not restrict the Next 72h plan.',
    why: `${morningReadiness.headline} ${plan.morningReadiness?.summary ?? ''}`.trim(),
    safeNextAction: 'Use the normal race/build recommendation while respecting caps and race proximity.',
    consequence: 'The risk is not the planned work; it is exceeding the cap and consuming the next 48–72h recovery budget.',
  }
}

export function buildCoachBriefing(input: {
  decision: DailyDecision
  recommendation: WorkoutRecommendation
  state: CurrentState
  next72Plan: Next72Plan
  readiness?: GoalReadinessResult
  morningReadiness?: MorningReadinessVerdict
}): CoachBriefing {
  const { decision, recommendation, state, next72Plan, readiness, morningReadiness } = input
  const nextRace = decision.nextRace?.name ?? 'no fixed race loaded'
  const action = recommendation.primary.durationMin
    ? `${recommendation.primary.title} · ${recommendation.primary.durationMin} min`
    : recommendation.primary.title

  const status = decision.status === 'InjuryIllness'
    ? 'Blocked: injury/illness overrides racing and training.'
    : `${decision.mode.replace(/([A-Z])/g, ' $1').trim()} · ${decision.status}. Next race: ${nextRace}.`

  const nextAction = decision.status === 'InjuryIllness'
    ? 'Stop training load, protect sleep and nutrition, and reassess symptoms before any race decision.'
    : decision.status === 'Red'
      ? 'Log rest or a capped recovery spin, then reassess tomorrow morning signals.'
      : decision.today === 'Race'
        ? 'Execute the fixed race, fuel aggressively, and start recovery immediately after finish.'
        : `Stay under the cap and log the decision so AERION can adapt from actual behavior.`

  return {
    headline: decision.status === 'InjuryIllness'
      ? 'Injury or illness block active. Recovery is the session.'
      : decision.status === 'Red'
        ? 'Protect the engine. Fitness is not built by arguing with red signals.'
        : decision.today === 'Race'
          ? 'Race execution day. Spend matches deliberately.'
          : 'Controlled build. Useful work, low drama.',
    status,
    recommendation: action,
    consequence: buildConsequence(decision, state, next72Plan),
    nextAction,
    confidence: readiness?.confidence ?? 'medium',
    tone: toneForDecision(decision),
    dominantConstraint: dominantConstraint(decision, state, readiness),
    missingSignals: missingSignals(state),
    readinessAdjustment: buildReadinessAdjustment(morningReadiness, next72Plan),
  }
}
