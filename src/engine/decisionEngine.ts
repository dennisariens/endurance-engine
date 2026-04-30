import type { Activity, CurrentState, DailyDecision, Race } from '../domain/types'
import { daysBetween, detectRaceBlock, getNextRace } from './calendarEngine'
import { getLatestRaceCost } from './raceCostEngine'

export function makeDailyDecision(input: {
  today: string
  races: Race[]
  activities: Activity[]
  state: CurrentState
}): DailyDecision {
  const { today, races, activities, state } = input
  const nextRace = getNextRace(races, today)
  const daysUntilNextRace = nextRace ? daysBetween(today, nextRace.date) : undefined
  const raceToday = daysUntilNextRace === 0
  const raceTomorrow = daysUntilNextRace === 1
  const raceBlock = detectRaceBlock(races, today)
  const latestRaceCost = getLatestRaceCost(activities)
  const injuryIllness = state.injury_present || state.illness_present
  const recoveryRed = state.recovery_status === 'red' || latestRaceCost.band === 'Extreme'

  if (injuryIllness) {
    return {
      date: today,
      status: 'InjuryIllness',
      mode: 'RecoveryOptimization',
      today: 'Rest',
      coreAllowed: false,
      strengthAllowed: false,
      fastingAllowed: false,
      raceWeightAllowed: false,
      nextRace,
      daysUntilNextRace,
      raceBlock,
      reasons: ['Injury or illness is present', 'Fixed races are blocked only for injury/illness', 'Recovery is the only useful work today'],
    }
  }

  if (raceToday) {
    const damage = recoveryRed || raceBlock.active
    return {
      date: today,
      status: damage ? 'Red' : 'Green',
      mode: damage ? 'DamageControl' : 'Race',
      today: 'Race',
      coreAllowed: !damage,
      strengthAllowed: false,
      fastingAllowed: false,
      raceWeightAllowed: false,
      nextRace,
      daysUntilNextRace,
      raceBlock,
      reasons: [
        `${nextRace?.name} is fixed today`,
        damage ? 'Recovery/fatigue says damage-control' : 'No injury or illness block present',
        'Race is allowed; optimize recovery around it',
      ],
    }
  }

  if (raceTomorrow) {
    return {
      date: today,
      status: recoveryRed ? 'Red' : 'Yellow',
      mode: 'DamageControl',
      today: 'Recovery',
      hrCap: 145,
      coreAllowed: recoveryRed ? false : true,
      strengthAllowed: false,
      fastingAllowed: false,
      raceWeightAllowed: false,
      nextRace,
      daysUntilNextRace,
      raceBlock,
      reasons: [`${nextRace?.name} is tomorrow`, 'Preserve freshness; no extra intensity', 'Fuel and sleep beat training heroics today'],
    }
  }

  if (latestRaceCost.band === 'High' || latestRaceCost.band === 'Extreme' || state.recovery_status === 'red') {
    return {
      date: today,
      status: 'Red',
      mode: 'RecoveryOptimization',
      today: 'Recovery',
      hrCap: 145,
      coreAllowed: false,
      strengthAllowed: false,
      fastingAllowed: false,
      raceWeightAllowed: false,
      nextRace,
      daysUntilNextRace,
      raceBlock,
      reasons: [`Latest race cost is ${latestRaceCost.score} / ${latestRaceCost.band}`, 'Recovery state is not ready for load', 'Zone 1 or rest creates the adaptation window'],
    }
  }

  return {
    date: today,
    status: raceBlock.active ? 'Yellow' : 'Green',
    mode: raceBlock.active ? 'RaceBlock' : 'Build',
    today: 'Z2',
    hrCap: 150,
    coreAllowed: true,
    strengthAllowed: !raceBlock.active,
    fastingAllowed: !raceBlock.active,
    raceWeightAllowed: !raceBlock.active,
    nextRace,
    daysUntilNextRace,
    raceBlock,
    reasons: ['No race today or tomorrow', 'Recovery is acceptable', 'Build aerobic volume without adding grey-zone junk'],
  }
}
