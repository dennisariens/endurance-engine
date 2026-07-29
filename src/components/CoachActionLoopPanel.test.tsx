import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CoachActionLoop } from '../engine/coachActionLoopEngine'
import { CoachActionLoopPanel } from './CoachActionLoopPanel'

const awaiting: CoachActionLoop = {
  status: 'awaiting-choice',
  headline: 'Choose today’s executed scenario to close the loop.',
  tomorrowAdjustment: 'No adjustment yet. AERION needs the actual choice before recalculating tomorrow.',
  guardrails: ['Keep sleep and normal fueling boringly consistent'],
  coachNote: 'The logged actual becomes the next input state.',
}

const logged: CoachActionLoop = {
  status: 'logged',
  headline: 'Rest logged. Tomorrow now starts from actual behavior, not intention.',
  selectedScenario: { id: 'rest', label: 'Rest', availability: 'available', horizon: '+24h to +72h', expectedCost: 6, expectedCostRange: { low: 3, high: 9 }, tomorrowFatigueDelta: -8, tomorrowFatigueDeltaRange: { low: -11, high: -5 }, recoveryLagDays: 0, recoveryLagDaysRange: { low: 0, high: 0 }, performanceRisk: 'low', nextRaceRisk: 'Low next-race risk', consequence: 'Adaptation room.', nextAction: 'Protect sleep.', tone: 'green' },
  tomorrowAdjustment: 'If morning signals improve, reassess for easy aerobic work; otherwise keep the recovery lane.',
  guardrails: ['Keep sleep and normal fueling boringly consistent'],
  coachNote: 'No judgment layer.',
}

describe('CoachActionLoopPanel', () => {
  it('renders awaiting-choice state', () => {
    const markup = renderToStaticMarkup(<CoachActionLoopPanel loop={awaiting} />)

    expect(markup).toContain('COACH ACTION LOOP')
    expect(markup).toContain('AWAITING CHOICE')
    expect(markup).toContain('No adjustment yet')
  })

  it('renders logged scenario and tomorrow adjustment', () => {
    const markup = renderToStaticMarkup(<CoachActionLoopPanel loop={logged} />)

    expect(markup).toContain('LOGGED')
    expect(markup).toContain('Rest logged')
    expect(markup).toContain('reassess for easy aerobic')
    expect(markup).toContain('Cost 3–9')
  })
})
