# Architecture

## Recommended Stack

Frontend/app:
- Next.js or Vite + React
- TypeScript
- Tailwind CSS
- shadcn/ui or simple local components
- Recharts for lightweight charts

Local data:
- JSON/YAML files first
- SQLite later if interactions grow

Backend/API:
- Local Next API routes or small FastAPI service
- Intervals.icu sync script first
- n8n automation later

## Data Model

### Race

```ts
type Race = {
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
```

### BlockedDate

```ts
type BlockedDate = {
  id: string
  startDate: string
  endDate: string
  reason: 'travel' | 'work' | 'illness' | 'injury' | 'unavailable' | 'other'
  blocksRace: boolean
  notes?: string
}
```

### Activity

```ts
type Activity = {
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
  raceCostBand?: 'Low' | 'Medium' | 'High' | 'Extreme'
}
```

### DailyDecision

```ts
type DailyDecision = {
  date: string
  status: 'Green' | 'Yellow' | 'Red' | 'InjuryIllness'
  mode: 'Build' | 'Race' | 'DamageControl' | 'RecoveryOptimization' | 'RaceBlock'
  today: 'Race' | 'Z2' | 'Recovery' | 'Rest'
  hrCap?: number
  powerCap?: number
  coreAllowed: boolean
  strengthAllowed: boolean
  fastingAllowed: boolean
  raceWeightAllowed: boolean
  reasons: string[]
}
```

## Engine Modules

- calendarEngine
- raceCostEngine
- recoveryEngine
- zoneEngine
- decisionEngine
- briefingEngine

## Integration Plan

Phase 1:
- local JSON/YAML ingest
- manual calendar edits
- static dashboard

Phase 2:
- Intervals.icu pull via env API key
- scheduled local sync
- race cost from activity summaries

Phase 3:
- detailed activity streams
- HR drift and time-in-zone calculations
- n8n daily briefing

Phase 4:
- hosted app or private dashboard
- GitHub Actions/cron sync if desired
