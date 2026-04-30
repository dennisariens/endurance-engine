export type Status = 'Green' | 'Yellow' | 'Red' | 'InjuryIllness'
export type Mode = 'Build' | 'Race' | 'DamageControl' | 'RecoveryOptimization' | 'RaceBlock'

export type Race = {
  id: string
  date: string
  name: string
  series?: string
  phase?: string
  discipline: 'cycling' | 'running' | 'triathlon' | 'other'
  format?: 'road' | 'itt' | 'stage' | 'other'
  priority: 'fixed' | 'optional'
  mandatory: boolean
  class?: number
  distanceKm?: number
  elevationM?: number
  notes?: string
}

export type DailyDecision = {
  date: string
  status: Status
  mode: Mode
  today: 'Race' | 'Z2' | 'Recovery' | 'Rest'
  hrCap?: number
  powerCap?: number
  coreAllowed: boolean
  strengthAllowed: boolean
  fastingAllowed: boolean
  raceWeightAllowed: boolean
  reasons: string[]
}
