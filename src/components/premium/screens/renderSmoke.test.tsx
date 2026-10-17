import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GoalsScreen, HistoryScreen, HomeScreen, PerformanceScreen, RecoveryScreen } from './index'
import { buildPremiumScreenFixture } from './premiumScreenFixture'

const props = buildPremiumScreenFixture()

describe('premium screen render smoke', () => {
  it('renders Home mission control with coach and next 72h context', () => {
    const markup = renderToStaticMarkup(<HomeScreen {...props} />)
    expect(markup).toContain('WHAT DO I DO TODAY?')
    expect(markup).toContain('Why this recommendation?')
    expect(markup).toContain('The next 72 hours')
    expect(markup).toContain('The evidence behind today')
    expect(markup).not.toContain('readiness-orb')
  })

  it('preserves zero recovery and does not replace it with goal readiness', () => {
    const markup = renderToStaticMarkup(<HomeScreen {...props} state={{ ...props.state, recovery_score: 0, last_updated: props.today }} />)
    expect(markup).toContain('0 / 100')
    expect(markup).toContain('Recovery score')
    expect(markup).toContain('Goal readiness · model estimate')
  })

  it('does not invent readiness or a session when evidence is absent', () => {
    const markup = renderToStaticMarkup(<HomeScreen {...props} activities={[]} state={{ injury_present: false, illness_present: false, recovery_status: 'unknown' }} />)
    expect(markup).toContain('Establish your starting point.')
    expect(markup).toContain('Unavailable')
    expect(markup).not.toContain('View session')
    expect(markup).not.toContain('72 / 100')
  })

  it('withholds a decision when recovery is stale or conflicting', () => {
    for (const state of [{ ...props.state, recovery_score: 80, last_updated: '2000-01-01' }, { ...props.state, recovery_score: 80, last_updated: props.today, data_conflicts: ['Conflicting sources'] }]) {
      const markup = renderToStaticMarkup(<HomeScreen {...props} state={state} />)
      expect(markup).not.toContain('View session')
      expect(markup).toContain('role="status"')
    }
  })

  it('keeps the engine safety restriction visible even without recovery measurements', () => {
    const markup = renderToStaticMarkup(<HomeScreen {...props} activities={[]} state={{ injury_present: true, illness_present: false, recovery_status: 'unknown' }} recommendation={{ ...props.recommendation, primary: { ...props.recommendation.primary, title: 'Medical recovery', purpose: 'Injury overrides training.' } }} />)
    expect(markup).toContain('Medical recovery')
    expect(markup).toContain('Injury overrides training.')
    expect(markup).toContain('View session')
    expect(markup).toContain('Unavailable')
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
    expect(markup).toContain('Deletion requires confirmation')
    expect(markup).toContain('Set primary mission')
    expect(markup).toContain('Make this the primary mission')
    expect(markup).toContain('Delete')
    expect(markup).toContain('Goal selection')
  })
})
