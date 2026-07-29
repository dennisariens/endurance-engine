import type { CurrentState, DailyDecision } from '../domain/types'

export type ScenarioId = 'race' | 'rest' | 'easy' | 'ignore'
export type ScenarioRisk = 'low' | 'medium' | 'high' | 'blocked'
export type ScenarioAvailability = 'available' | 'advisory' | 'blocked'
export type SimulationConfidence = 'low' | 'medium' | 'high'

export type EstimateRange = {
  low: number
  high: number
}

export type ScenarioOutcome = {
  id: ScenarioId
  label: string
  availability: ScenarioAvailability
  horizon: '+24h to +72h'
  expectedCost: number
  expectedCostRange: EstimateRange
  tomorrowFatigueDelta: number
  tomorrowFatigueDeltaRange: EstimateRange
  recoveryLagDays: number
  recoveryLagDaysRange: EstimateRange
  performanceRisk: ScenarioRisk
  nextRaceRisk: string
  consequence: string
  nextAction: string
  tone: 'green' | 'yellow' | 'red' | 'purple' | 'blue'
}

export type ScenarioSimulation = {
  summary: string
  primaryConstraint: string
  confidence: SimulationConfidence
  missingSignals: string[]
  disclaimer: string
  scenarios: ScenarioOutcome[]
}

type Input = {
  decision: DailyDecision
  state: CurrentState
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)))
const rangeAround = (value: number, spread: number, min = 0, max = 100): EstimateRange => ({
  low: clamp(value - spread, min, max),
  high: clamp(value + spread, min, max),
})

function garminReadinessPenalty(state: CurrentState): number {
  let penalty = 0
  if ((state.garmin_body_battery ?? 100) < 25) penalty += 14
  else if ((state.garmin_body_battery ?? 100) < 45) penalty += 8
  if ((state.garmin_training_readiness ?? 100) < 35) penalty += 14
  else if ((state.garmin_training_readiness ?? 100) < 50) penalty += 8
  if ((state.garmin_stress_avg ?? 0) > 55) penalty += 10
  else if ((state.garmin_stress_avg ?? 0) > 40) penalty += 5
  if ((state.garmin_sleep_score ?? 100) < 55 || (state.sleep_score ?? 100) < 55) penalty += 8
  if (/low|poor|strained/i.test(state.garmin_hrv_status ?? '')) penalty += 10
  if (/unbalanced|watch|caution/i.test(state.garmin_hrv_status ?? '')) penalty += 5
  return penalty
}

function recoveryPenalty(state: CurrentState): number {
  let penalty = 0
  if (state.recovery_status === 'yellow') penalty += 10
  if (state.recovery_status === 'red') penalty += 24
  if ((state.recovery_score ?? 100) < 45) penalty += 14
  if (state.hrv_trend === 'declining') penalty += 8
  if ((state.sleep_hours_14d_avg ?? 8) < 6.2) penalty += 8
  if ((state.latest_race_cost ?? 0) >= 70 || state.latest_race_cost_band === 'High' || state.latest_race_cost_band === 'Extreme') penalty += 16
  return penalty
}

function proximityPenalty(decision: DailyDecision): number {
  const days = decision.daysUntilNextRace
  if (typeof days !== 'number') return 0
  if (days <= 1) return 22
  if (days <= 3) return 14
  if (days <= 7) return 6
  return 0
}

function primaryConstraint(decision: DailyDecision, state: CurrentState): string {
  if (state.injury_present || state.illness_present || decision.status === 'InjuryIllness') return 'Injury / illness'
  if (typeof decision.daysUntilNextRace === 'number' && decision.daysUntilNextRace <= 3) return 'Race proximity'
  if (garminReadinessPenalty(state) >= 20) return 'Garmin readiness strain'
  if (state.recovery_status === 'red' || (state.recovery_score ?? 100) < 45) return 'Recovery debt'
  if ((state.latest_race_cost ?? 0) >= 70 || state.latest_race_cost_band === 'High' || state.latest_race_cost_band === 'Extreme') return 'Race-cost debt'
  return 'Aerobic build'
}

function missingSignals(state: CurrentState): string[] {
  const missing: string[] = []
  if (typeof state.garmin_body_battery !== 'number') missing.push('Garmin Body Battery')
  if (typeof state.garmin_training_readiness !== 'number') missing.push('Garmin Training Readiness')
  if (!state.garmin_hrv_status && !state.hrv_trend) missing.push('HRV status/trend')
  if (typeof state.sleep_score !== 'number' && typeof state.garmin_sleep_score !== 'number') missing.push('Sleep score')
  if (typeof state.cycle_lthr !== 'number' && typeof state.run_lthr !== 'number') missing.push('LTHR/AeT calibration')
  return missing
}

function confidenceFor(state: CurrentState): SimulationConfidence {
  const missing = missingSignals(state).length
  const healthKnown = typeof state.recovery_score === 'number' || state.hrv_trend || typeof state.sleep_hours_14d_avg === 'number'
  if (missing <= 1 && healthKnown) return 'high'
  if (healthKnown) return 'medium'
  return 'low'
}

function riskFor(cost: number, availability: ScenarioAvailability): ScenarioRisk {
  if (availability === 'blocked') return 'blocked'
  if (cost >= 70) return 'high'
  if (cost >= 35) return 'medium'
  return 'low'
}

function lagFor(cost: number): number {
  if (cost >= 90) return 5
  if (cost >= 75) return 4
  if (cost >= 55) return 3
  if (cost >= 30) return 2
  if (cost >= 12) return 1
  return 0
}

function nextRaceRisk(decision: DailyDecision, cost: number, availability: ScenarioAvailability): string {
  if (availability === 'blocked') return 'Blocked: injury/illness overrides the fixed race rule.'
  const days = decision.daysUntilNextRace
  if (typeof days !== 'number') return cost >= 65 ? 'Elevated recovery debt without a loaded race target.' : 'No loaded next-race risk; keep cost controlled.'
  if (days <= 1 && cost >= 25) return 'Freshness risk: tomorrow’s fixed race starts with extra fatigue.'
  if (days <= 3 && cost >= 45) return 'Elevated next-race risk: taper window gets consumed by repair work.'
  if (days <= 7 && cost >= 65) return 'Elevated next-race risk: recovery lag may reach the race window.'
  if (cost < 20) return 'Low next-race risk; freshness improves if sleep/fueling hold.'
  return 'Manageable next-race risk if tomorrow is kept honest.'
}

function scenario(input: {
  id: ScenarioId
  label: string
  baseCost: number
  baseFatigue: number
  decision: DailyDecision
  state: CurrentState
  consequence: string
  nextAction: string
  tone: ScenarioOutcome['tone']
  availability?: ScenarioAvailability
}): ScenarioOutcome {
  const { id, label, baseCost, baseFatigue, decision, state, consequence, nextAction, tone } = input
  const blocked = state.injury_present || state.illness_present || decision.status === 'InjuryIllness'
  const availability: ScenarioAvailability = input.availability ?? (blocked && id === 'race' ? 'blocked' : id === 'ignore' ? 'advisory' : 'available')
  const modifier = recoveryPenalty(state) + garminReadinessPenalty(state) + proximityPenalty(decision)
  const multiplier = id === 'rest' ? 0.1 : id === 'easy' ? 0.35 : id === 'race' ? 0.75 : 1
  const blockedCost = availability === 'blocked' ? 95 : baseCost + modifier * multiplier
  const expectedCost = clamp(blockedCost)
  const fatigueDelta = availability === 'blocked' ? 45 : clamp(baseFatigue + modifier * multiplier, -20, 60)
  const recoveryLagDays = lagFor(expectedCost)
  return {
    id,
    label,
    availability,
    horizon: '+24h to +72h',
    expectedCost,
    expectedCostRange: rangeAround(expectedCost, id === 'rest' ? 3 : 8),
    tomorrowFatigueDelta: fatigueDelta,
    tomorrowFatigueDeltaRange: rangeAround(fatigueDelta, id === 'rest' ? 3 : 6, -20, 70),
    recoveryLagDays,
    recoveryLagDaysRange: { low: Math.max(0, recoveryLagDays - 1), high: recoveryLagDays + (expectedCost >= 55 ? 1 : 0) },
    performanceRisk: riskFor(expectedCost, availability),
    nextRaceRisk: nextRaceRisk(decision, expectedCost, availability),
    consequence,
    nextAction: availability === 'blocked' ? 'Do not race. Switch to medical recovery and reassess symptoms.' : nextAction,
    tone: availability === 'blocked' ? 'purple' : tone,
  }
}

export function buildScenarioSimulation({ decision, state }: Input): ScenarioSimulation {
  const raceAvailable = decision.today === 'Race' ? 'available' : 'advisory'
  const scenarios: ScenarioOutcome[] = [
    scenario({
      id: 'race',
      label: decision.today === 'Race' ? 'Race today' : 'Race / hard group simulation',
      baseCost: decision.today === 'Race' ? 68 : 72,
      baseFatigue: decision.today === 'Race' ? 32 : 36,
      decision,
      state,
      availability: (state.injury_present || state.illness_present || decision.status === 'InjuryIllness') ? 'blocked' : raceAvailable,
      consequence: 'Highest useful stimulus if it is actually a fixed race; otherwise it spends recovery capital aggressively.',
      nextAction: decision.today === 'Race' ? 'Execute the race, fuel early, then shut down bonus work.' : 'Only choose this if the event is fixed or deliberately worth the recovery cost.',
      tone: 'blue',
    }),
    scenario({
      id: 'rest',
      label: 'Rest',
      baseCost: 4,
      baseFatigue: -8,
      decision,
      state,
      consequence: 'Lowest cost. Gives adaptation room and improves the odds that the next useful session is actually useful.',
      nextAction: 'Eat normally, walk lightly if it helps, and protect sleep.',
      tone: 'green',
    }),
    scenario({
      id: 'easy',
      label: 'Easy aerobic',
      baseCost: 22,
      baseFatigue: 8,
      decision,
      state,
      consequence: 'Useful only if it stays boring: low HR, no surges, no disguised tempo.',
      nextAction: `Keep HR ≤ ${decision.hrCap ?? 145}; stop if HR drifts or legs feel heavy.`,
      tone: 'yellow',
    }),
    scenario({
      id: 'ignore',
      label: 'Ignore / high intensity',
      baseCost: 70,
      baseFatigue: 36,
      decision,
      state,
      consequence: 'May feel productive today, but often shifts the next 24–72h toward recovery management.',
      nextAction: 'If you override, log it honestly and expect the next 24–72h plan to tighten.',
      tone: 'red',
    }),
  ]

  return {
    summary: 'Compare today’s options by expected cost, fatigue, recovery lag, and next-race risk.',
    primaryConstraint: primaryConstraint(decision, state),
    confidence: confidenceFor(state),
    missingSignals: missingSignals(state),
    disclaimer: 'Predictions are ranges, not certainty. Actual completed work and recovery signals override the forecast.',
    scenarios,
  }
}
