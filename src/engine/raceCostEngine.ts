import type { Activity, RaceCostBand } from '../domain/types'

export type RaceCostFactor = {
  label: 'Duration' | 'Load' | 'Avg HR' | 'Max HR' | 'Density' | 'Race penalty'
  value: string
  points: number
  maxPoints: number
  note: string
}

export type RaceCostExplanation = {
  activity: Activity
  score: number
  band: RaceCostBand
  factors: RaceCostFactor[]
}

export function bandRaceCost(score: number): RaceCostBand {
  if (score <= 30) return 'Low'
  if (score <= 60) return 'Medium'
  if (score <= 80) return 'High'
  return 'Extreme'
}

export function estimateRaceCost(activity: Activity): { score: number; band: RaceCostBand } {
  if (typeof activity.raceCost === 'number') return { score: activity.raceCost, band: activity.raceCostBand ?? bandRaceCost(activity.raceCost) }

  const durationMin = (activity.durationSec ?? 0) / 60
  const load = activity.load ?? 0
  const avgHr = activity.avgHr ?? 0
  const maxHr = activity.maxHr ?? 0
  const durationPoints = Math.min(20, (durationMin / 120) * 20)
  const loadPoints = Math.min(40, (load / 130) * 40)
  const avgHrPoints = avgHr >= 160 ? 10 : avgHr >= 150 ? 7 : avgHr >= 140 ? 4 : 0
  const maxHrPoints = maxHr >= 180 ? 10 : maxHr >= 170 ? 6 : maxHr >= 160 ? 3 : 0
  const densityPoints = Math.min(15, (load / Math.max(durationMin, 1)) * 7)
  const racePenalty = racePenaltyPoints(activity)
  const score = Math.round(Math.min(100, durationPoints + loadPoints + avgHrPoints + maxHrPoints + densityPoints + racePenalty))
  return { score, band: bandRaceCost(score) }
}

export function explainRaceCost(activity: Activity): RaceCostExplanation {
  const hasFormulaInputs = activity.durationSec || activity.load || activity.avgHr || activity.maxHr
  if (typeof activity.raceCost === 'number' && !hasFormulaInputs) {
    return {
      activity,
      score: activity.raceCost,
      band: activity.raceCostBand ?? bandRaceCost(activity.raceCost),
      factors: [{ label: 'Race penalty', value: 'manual score', points: activity.raceCost, maxPoints: 100, note: 'Manual/imported race cost overrides formula factors.' }],
    }
  }

  const durationMin = (activity.durationSec ?? 0) / 60
  const load = activity.load ?? 0
  const avgHr = activity.avgHr ?? 0
  const maxHr = activity.maxHr ?? 0
  const factors: RaceCostFactor[] = [
    { label: 'Duration', value: durationMin ? `${Math.round(durationMin)} min` : 'n/a', points: Math.min(20, (durationMin / 120) * 20), maxPoints: 20, note: 'Longer hard events create more recovery debt.' },
    { label: 'Load', value: load ? `${load}` : 'n/a', points: Math.min(40, (load / 130) * 40), maxPoints: 40, note: 'Training load is the largest formula input.' },
    { label: 'Avg HR', value: avgHr ? `${avgHr} bpm` : 'n/a', points: avgHr >= 160 ? 10 : avgHr >= 150 ? 7 : avgHr >= 140 ? 4 : 0, maxPoints: 10, note: 'Sustained cardiovascular strain raises cost.' },
    { label: 'Max HR', value: maxHr ? `${maxHr} bpm` : 'n/a', points: maxHr >= 180 ? 10 : maxHr >= 170 ? 6 : maxHr >= 160 ? 3 : 0, maxPoints: 10, note: 'High peaks imply race-like stress.' },
    { label: 'Density', value: durationMin ? `${(load / Math.max(durationMin, 1)).toFixed(2)} load/min` : 'n/a', points: Math.min(15, (load / Math.max(durationMin, 1)) * 7), maxPoints: 15, note: 'Load packed into less time is more expensive.' },
    { label: 'Race penalty', value: racePenaltyPoints(activity) ? 'race-like' : 'none', points: racePenaltyPoints(activity), maxPoints: 10, note: 'Race context adds cost beyond raw load.' },
  ]
  const score = typeof activity.raceCost === 'number'
    ? activity.raceCost
    : Math.round(Math.min(100, factors.reduce((sum, factor) => sum + factor.points, 0)))
  return { activity, score, band: activity.raceCostBand ?? bandRaceCost(score), factors }
}

function racePenaltyPoints(activity: Activity): number {
  return /race|ecro|zwift racing league/i.test(activity.name) ? 10 : 0
}

export function getLatestRaceCost(activities: Activity[]): { activity?: Activity; score: number; band: RaceCostBand } {
  const latest = [...activities]
    .filter((activity) => typeof activity.raceCost === 'number' || /race|ecro|zwift racing league/i.test(activity.name))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!latest) return { score: 0, band: 'Low' }
  return { activity: latest, ...estimateRaceCost(latest) }
}
