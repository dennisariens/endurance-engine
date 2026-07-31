import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GoalsScreen, HistoryScreen, HomeScreen, PerformanceScreen, RecoveryScreen } from './index'
import { buildPremiumScreenFixture } from './premiumScreenFixture'

const props = buildPremiumScreenFixture()

describe('premium screen render smoke', () => {
  it('renders Home mission control with coach and next 72h context', () => {
    const markup = renderToStaticMarkup(<HomeScreen {...props} readyScore={props.readiness?.overallReadiness ?? 62} nextRace={props.decision.nextRace} />)

    expect(markup).toContain('AERION / Daily Recommendation')
    expect(markup).toContain('One-glance command overview')
    expect(markup).toContain('Daily, weekly, and long-term recommendation')
    expect(markup).toContain('Home answers: can I train')
    expect(markup).toContain('AI Coach summary')
    expect(markup).toContain('Next 72h')
  })

  it('renders Performance telemetry without hiding chart shells', () => {
    const markup = renderToStaticMarkup(<PerformanceScreen {...props} />)

    expect(markup).toContain('Telemetry depth, restrained')
    expect(markup).toContain('Load balance')
    expect(markup).toContain('Race cost trend')
    expect(markup).toContain('Goal readiness trajectory')
  })

  it('renders History with agenda/log and health metrics', () => {
    const markup = renderToStaticMarkup(<HistoryScreen {...props} />)

    expect(markup).toContain('Proof, not planning')
    expect(markup).toContain('One-glance history overview')
    expect(markup).toContain('Activity split metrics')
    expect(markup).toContain('Health and readiness history')
    expect(markup).toContain('Training status')
  })

  it('renders Recovery protection layer with readiness and lag charts', () => {
    const markup = renderToStaticMarkup(<RecoveryScreen {...props} />)

    expect(markup).toContain('Protection layer')
    expect(markup).toContain('Readiness signals')
    expect(markup).toContain('Recovery lag projection')
    expect(markup).toContain(props.morningReadiness.headline)
  })

  it('renders Goals with delete controls for existing goals', () => {
    const markup = renderToStaticMarkup(<GoalsScreen {...props} />)

    expect(markup).toContain('Delete active goal')
    expect(markup).toContain('Delete')
    expect(markup).toContain('Goal selection')
  })
})
