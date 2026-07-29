import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ActualOverride } from '../engine/actualOverrideEngine'
import { ActualOverridePanel } from './ActualOverridePanel'

const override: ActualOverride = {
  status: 'actual-overrides-log',
  authoritativeSource: 'completed-activity',
  severity: 'red',
  headline: 'Completed activity overrides the plan/log.',
  plannedSummary: 'Bike recovery spin / optional opener · 35 min · HR ≤ 145',
  loggedSummary: 'Rest · 0 min · scenario-rest',
  actualSummary: 'ECRO Zwift Race · 70 min · load 108 · race cost 86',
  deltaSummary: 'Rest logged, but actual work exists. Completed work overrides intent.',
  tomorrowImpact: 'Tomorrow should recalculate from completed load, duration, HR/power, race-like classification, and morning readiness.',
}

describe('ActualOverridePanel', () => {
  it('renders planned vs logged vs completed truth', () => {
    const markup = renderToStaticMarkup(<ActualOverridePanel override={override} />)

    expect(markup).toContain('ACTUAL OVERRIDE')
    expect(markup).toContain('COMPLETED ACTIVITY')
    expect(markup).toContain('Planned')
    expect(markup).toContain('Logged')
    expect(markup).toContain('Completed')
    expect(markup).toContain('Rest logged, but actual work exists')
    expect(markup).toContain('recalculate from completed load')
  })
})
