import type { Activity, RaceCostBand } from '../domain/types'

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
  const racePenalty = /race|ecro|zwift racing league/i.test(activity.name) ? 10 : 0
  const score = Math.round(Math.min(100, durationPoints + loadPoints + avgHrPoints + maxHrPoints + densityPoints + racePenalty))
  return { score, band: bandRaceCost(score) }
}

export function getLatestRaceCost(activities: Activity[]): { activity?: Activity; score: number; band: RaceCostBand } {
  const latest = [...activities]
    .filter((activity) => typeof activity.raceCost === 'number' || /race|ecro|zwift racing league/i.test(activity.name))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!latest) return { score: 0, band: 'Low' }
  return { activity: latest, ...estimateRaceCost(latest) }
}
