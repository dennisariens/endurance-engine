import type { Activity, Race } from '../domain/types'
import { daysBetween } from './calendarEngine'
import { estimateRaceCost } from './raceCostEngine'

export type DashboardStats = {
  racesNext30d: number
  racesNext7d: number
  fixedRaceCount: number
  avgRaceCost: number
  highCostActivities: number
  weeklyRaceDensity: Array<{ label: string; count: number }>
  raceCostSeries: Array<{ label: string; value: number }>
  disciplineMix: Array<{ label: string; value: number }>
}

export function buildDashboardStats(input: { today: string; races: Race[]; activities: Activity[] }): DashboardStats {
  const { today, races, activities } = input
  const future = races.filter((race) => daysBetween(today, race.date) >= 0)
  const racesNext30d = future.filter((race) => daysBetween(today, race.date) <= 30).length
  const racesNext7d = future.filter((race) => daysBetween(today, race.date) <= 7).length
  const fixedRaceCount = races.filter((race) => race.mandatory || race.priority === 'fixed').length

  const costed = activities.map((activity) => ({ activity, cost: estimateRaceCost(activity) }))
  const avgRaceCost = costed.length ? Math.round(costed.reduce((sum, item) => sum + item.cost.score, 0) / costed.length) : 0
  const highCostActivities = costed.filter((item) => item.cost.band === 'High' || item.cost.band === 'Extreme').length
  const raceCostSeries = costed
    .sort((a, b) => a.activity.date.localeCompare(b.activity.date))
    .slice(-8)
    .map((item) => ({ label: item.activity.date.slice(5), value: item.cost.score }))

  const weeklyRaceDensity = Array.from({ length: 6 }, (_, index) => {
    const start = index * 7
    const end = start + 6
    return {
      label: `+${start}-${end}d`,
      count: future.filter((race) => {
        const delta = daysBetween(today, race.date)
        return delta >= start && delta <= end
      }).length,
    }
  })

  const mixMap = activities.reduce<Record<string, number>>((acc, activity) => {
    const key = activity.type || 'other'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const disciplineMix = Object.entries(mixMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  return { racesNext30d, racesNext7d, fixedRaceCount, avgRaceCost, highCostActivities, weeklyRaceDensity, raceCostSeries, disciplineMix }
}
