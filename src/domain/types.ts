export type Status = 'Green' | 'Yellow' | 'Red' | 'InjuryIllness'
export type Mode = 'Build' | 'Race' | 'DamageControl' | 'RecoveryOptimization' | 'RaceBlock'
export type TodayAction = 'Race' | 'Z2' | 'Recovery' | 'Rest'
export type Theme = 'dark' | 'light'
export type WorkoutDiscipline = 'bike' | 'run' | 'bike-run' | 'off'

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
  vo2max?: number | null
  hrv_trend?: 'improving' | 'stable' | 'declining' | 'unknown' | null
  sleep_score?: number | null
  recovery_score?: number | null
  body_weight_kg?: number | null
  garmin_body_battery?: number | null
  garmin_stress_avg?: number | null
  garmin_training_readiness?: number | null
  garmin_sleep_score?: number | null
  garmin_hrv_status?: string | null
  run_lthr?: number | null
  cycle_lthr?: number | null
  run_aet?: number | null
  cycle_aet?: number | null
}

export type WorkoutOption = {
  discipline: WorkoutDiscipline
  title: string
  durationMin: number
  intensity: 'rest' | 'easy' | 'z2' | 'opener' | 'race'
  hrCap?: number
  powerCap?: number
  purpose: string
  steps: string[]
  cautions: string[]
}

export type WorkoutRecommendation = {
  primary: WorkoutOption
  bike?: WorkoutOption
  run?: WorkoutOption
  goalReminder: string
  longTermBias: string
}


export type DecisionLogAction = 'accepted' | 'rested' | 'overridden'

export type DecisionLogEntry = {
  id: string
  date: string
  loggedAt: string
  action: DecisionLogAction
  mode: Mode
  status: Status
  workoutTitle: string
  durationMin: number
  hrCap?: number
  powerCap?: number
  reason: string
  note?: string
  nextRaceName?: string
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
