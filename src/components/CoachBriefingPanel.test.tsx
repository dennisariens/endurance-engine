import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CoachBriefing } from '../engine/coachBriefingEngine'
import { CoachBriefingPanel } from './CoachBriefingPanel'

const briefing: CoachBriefing = {
  headline: 'Protect the engine. Fitness is not built by arguing with red signals.',
  status: 'Recovery Optimization · Red. Next race: Chasing Pink - Stage 1.',
  recommendation: 'Bike recovery spin / optional opener · 35 min',
  consequence: 'If you add intensity, tomorrow’s recovery debt likely extends and the next fixed race starts compromised.',
  nextAction: 'Log rest or a capped recovery spin, then reassess tomorrow morning signals.',
  confidence: 'medium',
  tone: 'red',
  dominantConstraint: 'recovery debt · race cost 80 / High',
  missingSignals: ['Body Battery', 'Training Readiness'],
}

describe('CoachBriefingPanel', () => {
  it('renders coach loop, consequence, next action, and missing signals', () => {
    const markup = renderToStaticMarkup(<CoachBriefingPanel briefing={briefing} />)

    expect(markup).toContain('AERION COACH')
    expect(markup).toContain('If you ignore it')
    expect(markup).toContain('Consequence')
    expect(markup).toContain('Do this now')
    expect(markup).toContain('Body Battery')
    expect(markup).toContain('Actual completed work remains authoritative')
  })
})
