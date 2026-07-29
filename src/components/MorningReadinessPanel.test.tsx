import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { MorningReadinessVerdict } from '../engine/morningReadinessEngine'
import { MorningReadinessPanel } from './MorningReadinessPanel'

const verdict: MorningReadinessVerdict = {
  date: '2026-05-09',
  verdict: 'Modify',
  forwardState: 'hold',
  tone: 'yellow',
  headline: 'Proceed only with modifications. Readiness is usable, not generous.',
  primaryAction: 'Modify: keep work easy, short, capped, and readiness-led.',
  reasons: ['yesterday actual is canonical: Completed activity was harder than logged.', 'Caution readiness signals: HRV Status.'],
  yesterdaySummary: 'ECRO Zwift Race · 70 min · load 108',
  signals: [
    { label: 'Body Battery', value: '74', status: 'green', note: 'Reserve.' },
    { label: 'Training Readiness', value: '62', status: 'green', note: 'Readiness.' },
    { label: 'HRV Status', value: 'unbalanced', status: 'yellow', note: 'HRV.' },
  ],
}

describe('MorningReadinessPanel', () => {
  it('renders verdict, forward state, action and readiness signals', () => {
    const markup = renderToStaticMarkup(<MorningReadinessPanel verdict={verdict} />)

    expect(markup).toContain('MORNING READINESS')
    expect(markup).toContain('Modify')
    expect(markup).toContain('FORWARD HOLD')
    expect(markup).toContain('keep work easy')
    expect(markup).toContain('Body Battery')
    expect(markup).toContain('Training Readiness')
    expect(markup).toContain('unbalanced')
  })
})
