import type { CurrentState, DailyDecision, RaceCostBand } from '../domain/types'

export type Next72PlanBlock = {
  horizon: 'Today' | '+24h' | '+48h' | '+72h'
  date: string
  action: string
  allowedWork: string[]
  hardLimits: string[]
  why: string
  tone: 'green' | 'yellow' | 'red' | 'purple' | 'blue'
}

export type Next72Plan = {
  summary: string
  risk: RaceCostBand | 'InjuryIllness'
  blocks: Next72PlanBlock[]
}

const horizons: Next72PlanBlock['horizon'][] = ['Today', '+24h', '+48h', '+72h']

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function capLimit(decision: DailyDecision): string {
  return `HR ≤ ${decision.hrCap ?? 145} · provisional ceiling`
}

function latestCostBand(state: CurrentState): RaceCostBand {
  return state.latest_race_cost_band ?? 'Low'
}

function isHighDebt(state: CurrentState): boolean {
  const band = latestCostBand(state)
  return state.recovery_status === 'red' || band === 'High' || band === 'Extreme' || (state.latest_race_cost ?? 0) >= 70
}

function injuryIllnessPlan(decision: DailyDecision): Next72Plan {
  return {
    summary: 'Injury/illness block active. Training and racing are blocked; recovery is the work.',
    risk: 'InjuryIllness',
    blocks: horizons.map((horizon, index) => ({
      horizon,
      date: addDays(decision.date, index),
      action: 'Medical recovery',
      allowedWork: ['Rest', 'Mobility only if symptoms allow', 'Walk only if it improves recovery'],
      hardLimits: ['No racing', 'No training load', 'No strength', 'No fasting'],
      why: 'Injury or illness overrides the mandatory race rule. Do not negotiate with biology; it has lawyers.',
      tone: 'purple',
    })),
  }
}

function raceDayPlan(decision: DailyDecision, state: CurrentState): Next72Plan {
  return {
    summary: 'Fixed race today. Execute the mandatory event, then protect the post-race recovery window.',
    risk: latestCostBand(state),
    blocks: horizons.map((horizon, index) => {
      if (index === 0) {
        return {
          horizon,
          date: addDays(decision.date, index),
          action: 'Race execution',
          allowedWork: ['Mandatory race override active', 'Warm up, race, spin down', 'Fuel before, during, and after'],
          hardLimits: ['No bonus volume', 'No extra intensity after finish', 'Recovery starts immediately'],
          why: 'The fixed race stays allowed because no injury or illness block is present.',
          tone: 'blue',
        }
      }
      return {
        horizon,
        date: addDays(decision.date, index),
        action: index === 1 ? 'Post-race reset' : 'Recovery audit',
        allowedWork: ['Z1 spin or walk', 'Mobility', 'Normal fueling and early sleep'],
        hardLimits: [capLimit(decision), 'No bonus volume', 'No strength until recovery is green'],
        why: 'Race cost compounds quickly if the next day becomes secret training wearing a recovery moustache.',
        tone: index === 1 ? 'red' : 'yellow',
      }
    }),
  }
}

function highDebtPlan(decision: DailyDecision, state: CurrentState): Next72Plan {
  return {
    summary: 'Recovery debt is high. The next 72h are for absorbing work, not proving enthusiasm.',
    risk: latestCostBand(state),
    blocks: horizons.map((horizon, index) => ({
      horizon,
      date: addDays(decision.date, index),
      action: index <= 1 ? 'Recovery only' : 'Reassess easy movement',
      allowedWork: index <= 1 ? ['Rest', 'Walk 20–30 min', 'Mobility 8–10 min'] : ['Z1 spin or walk', 'Short run-walk only if legs are normal'],
      hardLimits: [capLimit(decision), 'No intensity', 'No strength', 'No fasting'],
      why: index <= 1
        ? 'Extreme/high race cost or red recovery means adaptation requires low stress now.'
        : 'Only reintroduce easy movement if HR, sleep, and legs stop objecting.',
      tone: index <= 1 ? 'red' : 'yellow',
    })),
  }
}

function raceProximityPlan(decision: DailyDecision, state: CurrentState): Next72Plan {
  return {
    summary: 'Race proximity is active. Preserve freshness and keep all optional work boring.',
    risk: latestCostBand(state),
    blocks: horizons.map((horizon, index) => {
      const isRaceWindow = typeof decision.daysUntilNextRace === 'number' && index >= decision.daysUntilNextRace
      return {
        horizon,
        date: addDays(decision.date, index),
        action: isRaceWindow ? 'Race / damage control' : 'Freshness preservation',
        allowedWork: isRaceWindow ? ['Mandatory race override if scheduled', 'Warm up and execute only'] : ['Easy spin', 'Short run-walk', 'Mobility'],
        hardLimits: [capLimit(decision), 'No grey-zone work', 'No strength', 'No weight-cutting'],
        why: isRaceWindow
          ? 'The fixed calendar decides execution; recovery decides how much damage is acceptable.'
          : 'Fitness will not be improved meaningfully this close to racing. It can, however, be harmed. Efficiently.',
        tone: isRaceWindow ? 'blue' : 'yellow',
      }
    }),
  }
}

function buildPlan(decision: DailyDecision, state: CurrentState): Next72Plan {
  return {
    summary: 'Build aerobic capacity while keeping recovery debt low.',
    risk: latestCostBand(state),
    blocks: horizons.map((horizon, index) => ({
      horizon,
      date: addDays(decision.date, index),
      action: index === 0 ? 'Aerobic build' : 'Progressive aerobic support',
      allowedWork: ['Low-HR aerobic work', 'Run-walk durability', 'Easy Z2 bike if legs respond'],
      hardLimits: [capLimit(decision), 'Caps are ceilings, not targets', 'Stop if HR drifts or legs feel heavy'],
      why: 'The useful work is accumulating low-cost aerobic time without creating race-cost debt.',
      tone: index === 0 ? 'green' : 'blue',
    })),
  }
}

export function buildNext72hPlan(input: { decision: DailyDecision; state: CurrentState }): Next72Plan {
  const { decision, state } = input
  if (decision.status === 'InjuryIllness' || state.injury_present || state.illness_present) return injuryIllnessPlan(decision)
  if (decision.today === 'Race') return raceDayPlan(decision, state)
  if (isHighDebt(state) || decision.status === 'Red') return highDebtPlan(decision, state)
  if (decision.mode === 'DamageControl' || decision.raceBlock.active || (decision.daysUntilNextRace ?? 99) <= 3) return raceProximityPlan(decision, state)
  return buildPlan(decision, state)
}
