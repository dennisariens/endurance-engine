import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Activity, CurrentState } from '../domain/types'
import { CostReadinessPanel } from './CostReadinessPanel'

const activity: Activity = {
  id: 'race-1',
  source: 'manual',
  date: '2026-04-30',
  name: 'Zwift Racing League Race',
  type: 'VirtualRide',
  durationSec: 4800,
  load: 105,
  avgHr: 154,
  maxHr: 181,
}

const state: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'red',
  resting_hr_14d_avg: 49.4,
  hrv_14d_avg: 49.2,
  sleep_hours_14d_avg: 7.9,
  vo2max: null,
}

describe('CostReadinessPanel', () => {
  it('renders race-cost factor breakdown and readiness signals without pretending VO2 max is synced', () => {
    const markup = renderToStaticMarkup(<CostReadinessPanel latestRaceActivity={activity} state={state} />)

    expect(markup).toContain('COST / READINESS')
    expect(markup).toContain('Race-cost transparency')
    expect(markup).toContain('Duration')
    expect(markup).toContain('Load')
    expect(markup).toContain('Avg HR')
    expect(markup).toContain('Max HR')
    expect(markup).toContain('Density')
    expect(markup).toContain('Race penalty')
    expect(markup).toContain('HRV')
    expect(markup).toContain('Sleep')
    expect(markup).toContain('Resting HR')
    expect(markup).toContain('VO2 max')
    expect(markup).toContain('Body Battery')
    expect(markup).toContain('Stress')
    expect(markup).toContain('Training Readiness')
    expect(markup).toContain('Sleep Score')
    expect(markup).toContain('HRV Status')
    expect(markup).toContain('not synced')
    expect(markup).toContain('VO2 max is displayed when available, but not currently driving recommendations')
  })
})
