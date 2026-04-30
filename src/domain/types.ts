export type Status = 'Green' | 'Yellow' | 'Red' | 'InjuryIllness'
export type Mode = 'Build' | 'Race' | 'DamageControl' | 'RecoveryOptimization' | 'RaceBlock'
export type TodayAction = 'Race' | 'Z2' | 'Recovery' | 'Rest'

export type Race = {
  id: string
  date: string
  dow?: string
  name: string
  series?: string
  phase?: string
  discipline: 'cycling' | 'running' | 'triathlon' | 'other'
  format?: 'road' | 'ITT' | 'itt' | 'stage' | 'other'
  route?: string | null
  priority: 'fixed' | 'optional'
  mandatory: boolean
  class?: number | null
  distanceKm?: number | null
  elevationM?: number | null
  notes?: string
}

export type Activity = {
  id: string
  source: 'intervals' | 'manual'
  date: string
  name: string
  type: string
  durationSec?: number
  distanceM?: number
  load?: number
  avgHr?: number
  maxHr?: number
  normalizedPower?: number
  avgPower?: number
  raceCost?: number
  raceCostBand?: RaceCostBand
}

export type BlockedDate = {
  id: string
  startDate: string
  endDate: string
  reason: 'travel' | 'work' | 'illness' | 'injury' | 'recovery' | 'unavailable' | 'other'
  blocksRace: boolean
  notes?: string
}

export type RaceCostBand = 'Low' | 'Medium' | 'High' | 'Extreme'

export type CurrentState = {
  last_updated?: string
  injury_present: boolean
  illness_present: boolean
  recovery_status: 'green' | 'yellow' | 'red' | 'unknown'
  race_today?: boolean
  race_tomorrow?: boolean
  latest_race_cost?: number | null
  latest_race_cost_band?: RaceCostBand | null
  run_max_hr_6m?: number | null
  cycle_max_hr_6m?: number | null
  eftp_watts?: number | null
  resting_hr_14d_avg?: number | null
  hrv_14d_avg?: number | null
  sleep_hours_14d_avg?: number | null
}

export type RaceBlock = {
  active: boolean
  racesWithin72h: number
  racesWithin7d: number
  reason: string
}

export type DailyDecision = {
  date: string
  status: Status
  mode: Mode
  today: TodayAction
  hrCap?: number
  powerCap?: number
  coreAllowed: boolean
  strengthAllowed: boolean
  fastingAllowed: boolean
  raceWeightAllowed: boolean
  nextRace?: Race
  daysUntilNextRace?: number
  raceBlock: RaceBlock
  reasons: string[]
}
