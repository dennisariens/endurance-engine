import type { Race, RaceBlock } from '../domain/types'

const DAY_MS = 24 * 60 * 60 * 1000

export function dateOnly(date: string | Date): string {
  if (date instanceof Date) return date.toISOString().slice(0, 10)
  return date.slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${dateOnly(from)}T00:00:00Z`).getTime()
  const b = new Date(`${dateOnly(to)}T00:00:00Z`).getTime()
  return Math.round((b - a) / DAY_MS)
}

export function getFutureRaces(races: Race[], today: string): Race[] {
  return [...races]
    .filter((race) => daysBetween(today, race.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getNextRace(races: Race[], today: string): Race | undefined {
  return getFutureRaces(races, today)[0]
}

export function detectRaceBlock(races: Race[], today: string): RaceBlock {
  const future = getFutureRaces(races, today)
  const racesWithin72h = future.filter((race) => daysBetween(today, race.date) <= 3).length
  const racesWithin7d = future.filter((race) => daysBetween(today, race.date) <= 7).length
  const active = racesWithin72h >= 2 || racesWithin7d >= 3
  const reason = active
    ? racesWithin72h >= 2
      ? `${racesWithin72h} races within 72h`
      : `${racesWithin7d} races within 7 days`
    : 'No race block active'
  return { active, racesWithin72h, racesWithin7d, reason }
}
