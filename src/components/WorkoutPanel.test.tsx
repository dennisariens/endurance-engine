import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { WorkoutRecommendation } from '../domain/types'
import { WorkoutPanel } from './WorkoutPanel'

const recommendation: WorkoutRecommendation = {
  primary: {
    discipline: 'run',
    title: 'Low-HR run durability',
    durationMin: 40,
    intensity: 'z2',
    hrCap: 150,
    purpose: 'Improve running economy at low HR.',
    steps: ['Stay under cap'],
    cautions: ['Caps are ceilings'],
  },
  goalReminder: 'Build the aerobic engine.',
  longTermBias: 'Prefer boring work.',
}

describe('WorkoutPanel', () => {
  it('labels displayed HR caps as provisional zones', () => {
    const markup = renderToStaticMarkup(<WorkoutPanel recommendation={recommendation} />)
    expect(markup).toContain('HR ≤ 150')
    expect(markup).toContain('Provisional zones')
  })
})
