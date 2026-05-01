import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BaselineZonesPanel } from './BaselineZonesPanel'

describe('BaselineZonesPanel', () => {
  const markup = renderToStaticMarkup(<BaselineZonesPanel />)

  it('renders the provisional zones label and pending requirements', () => {
    expect(markup).toContain('Provisional zones')
    expect(markup).toContain('running LTHR')
    expect(markup).toContain('running AeT / drift test')
    expect(markup).toContain('cycling LTHR')
    expect(markup).toContain('cycling AeT / endurance decoupling check')
  })

  it('shows athlete recovery baseline values', () => {
    expect(markup).toContain('74 kg')
    expect(markup).toContain('RHR 49.4')
    expect(markup).toContain('HRV 49.2')
    expect(markup).toContain('Sleep 7.9h')
  })

  it('shows running and cycling HR values as caps and ceilings, not targets', () => {
    expect(markup).toContain('Run recovery cap')
    expect(markup).toContain('≤ 140 bpm')
    expect(markup).toContain('Run easy aerobic cap')
    expect(markup).toContain('≤ 150 bpm')
    expect(markup).toContain('Bike recovery cap')
    expect(markup).toContain('≤ 135 bpm')
    expect(markup).toContain('Bike easy aerobic cap')
    expect(markup).toContain('≤ 145 bpm')
    expect(markup).toContain('HR caps are ceilings, not targets')
    expect(markup).not.toContain('target HR')
    expect(markup).not.toContain('HR target')
  })

  it('renders all cycling FTP zones', () => {
    expect(markup).toContain('Z1 recovery')
    expect(markup).toContain('&lt;=183W')
    expect(markup).toContain('Z2 endurance')
    expect(markup).toContain('186–250W')
    expect(markup).toContain('Z3 tempo')
    expect(markup).toContain('253–300W')
    expect(markup).toContain('Z4 threshold')
    expect(markup).toContain('303–350W')
    expect(markup).toContain('Z5 VO2')
    expect(markup).toContain('353–400W')
    expect(markup).toContain('Z6 anaerobic')
    expect(markup).toContain('403–500W')
  })
})
