import { baselineConfig } from '../config/baselineConfig'
import type { CurrentState, DailyDecision, WorkoutOption, WorkoutRecommendation } from '../domain/types'

function estimateAerobicCap(state: CurrentState, discipline: 'bike' | 'run'): number {
  const aet = discipline === 'bike' ? state.cycle_aet : state.run_aet
  if (aet) return aet
  const lthr = discipline === 'bike' ? state.cycle_lthr : state.run_lthr
  if (lthr) return Math.round(lthr * 0.88)
  return discipline === 'bike'
    ? baselineConfig.cycling.easy_cap_bpm
    : baselineConfig.running.easy_cap_bpm
}

function capBelow(decision: DailyDecision, estimatedCap: number): number {
  return Math.min(decision.hrCap ?? estimatedCap, estimatedCap)
}

function offOption(reason: string): WorkoutOption {
  return {
    discipline: 'off',
    title: 'No training — protect the adaptation window',
    durationMin: 0,
    intensity: 'rest',
    purpose: reason,
    steps: ['Walk 20–30 min if restless', 'Mobility 8–10 min', 'Fuel normally and sleep early'],
    cautions: ['No hidden tempo', 'No strength work', 'No fasting if race is within 48h'],
  }
}

export function makeWorkoutRecommendation(input: { decision: DailyDecision; state: CurrentState }): WorkoutRecommendation {
  const { decision, state } = input
  const bikeCap = capBelow(decision, estimateAerobicCap(state, 'bike'))
  const runCap = capBelow(decision, estimateAerobicCap(state, 'run'))
  const powerCap = decision.powerCap ?? (state.eftp_watts ? Math.round(state.eftp_watts * 0.62) : undefined)
  const goalReminder = 'Long-term goal: raise easy-run durability and keep low-HR running boring enough to actually work.'
  const longTermBias = 'When in doubt: choose the run-walk aerobic option over grey-zone bike work, unless a fixed race is inside 48h.'

  if (decision.status === 'InjuryIllness') {
    const primary = offOption('Injury/illness present. Racing and training are blocked; recovery is the workout.')
    return { primary, goalReminder, longTermBias }
  }

  if (decision.today === 'Race') {
    const primary: WorkoutOption = {
      discipline: 'bike',
      title: 'Race day — fixed event execution',
      durationMin: 45,
      intensity: 'race',
      hrCap: undefined,
      purpose: 'Execute the mandatory race while minimizing unnecessary damage.',
      steps: ['10–15 min easy warm-up', '3 × 20 sec openers if legs respond', 'Race the fixed event', '10 min easy spin-down'],
      cautions: ['Do not add bonus volume', 'Fuel the race fully', 'Recovery starts immediately after finish'],
    }
    return { primary, bike: primary, goalReminder, longTermBias }
  }

  if (decision.mode === 'DamageControl' || decision.today === 'Recovery') {
    const bike: WorkoutOption = {
      discipline: 'bike',
      title: 'Bike recovery spin / optional opener',
      durationMin: decision.daysUntilNextRace === 1 ? 25 : 35,
      intensity: decision.daysUntilNextRace === 1 ? 'opener' : 'easy',
      hrCap: bikeCap,
      powerCap,
      purpose: 'Keep blood moving without spending race readiness.',
      steps: decision.daysUntilNextRace === 1
        ? ['15–20 min very easy', 'Optional 3 × 10 sec leg speed, full recovery', 'Stop while it still feels too easy']
        : ['25–35 min easy spin', 'Cadence comfortable', 'Finish fresher than you started'],
      cautions: ['No sweet spot', 'No chasing watts', 'If HR drifts upward, end the session'],
    }
    const run: WorkoutOption = {
      discipline: 'run',
      title: 'Run-walk aerobic reset',
      durationMin: decision.daysUntilNextRace === 1 ? 15 : 25,
      intensity: 'easy',
      hrCap: Math.min(runCap, 145),
      purpose: 'Small low-HR run stimulus without compromising the fixed race calendar.',
      steps: ['Run-walk only', 'Nasal-breathing easy', 'Stop at first sign of heaviness or HR drift'],
      cautions: ['No strides today', 'No hills', 'The win is staying under cap, not pace. Barbaric concept, apparently.'],
    }
    return { primary: bike, bike, run, goalReminder, longTermBias }
  }

  const bike: WorkoutOption = {
    discipline: 'bike',
    title: 'Aerobic bike endurance',
    durationMin: decision.raceBlock.active ? 45 : 75,
    intensity: 'z2',
    hrCap: bikeCap,
    powerCap,
    purpose: 'Build aerobic volume without adding race-cost debt.',
    steps: ['10 min easy ramp', 'Main block steady Z2', '5–10 min cool-down'],
    cautions: ['Cap HR before power', 'No threshold scraps', 'Abort intensity if sleep/HRV feels off'],
  }
  const run: WorkoutOption = {
    discipline: 'run',
    title: 'Low-HR run durability',
    durationMin: decision.raceBlock.active ? 25 : 40,
    intensity: 'z2',
    hrCap: runCap,
    purpose: 'Improve running economy at low HR — the long-term limiter.',
    steps: ['5 min brisk walk', 'Easy run or 4:1 run-walk under cap', 'Stop before form degrades'],
    cautions: ['Pace is irrelevant', 'If HR drift exceeds ~5%, shorten next run', 'Keep ego in the garage'],
  }
  return { primary: run, bike, run, goalReminder, longTermBias }
}
