import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function AiCoachScreen({ briefing, morningReadiness, next72Plan }: Props) {
  const adjustment = briefing.readinessAdjustment
  const forwardStateLabel = morningReadiness.forwardState === 'extend'
    ? 'recovery-first extension'
    : morningReadiness.forwardState === 'hold'
      ? 'held / easy-only'
      : 'clear'
  const carriedSummary = next72Plan.morningReadiness?.summary?.replace(/[.]+$/, '') ?? 'no additional restriction'
  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header"><p className="eyebrow">AI Coach / Hermes</p><h2>{briefing.headline}</h2><p>Calm operational interpretation. No hype. No guilt. Recalculate from reality.</p></div>
      <div className="premium-coach-dialogue paginated-coach">
        <article><span>What changed</span><p>{adjustment?.changed ?? briefing.status}</p></article>
        <article><span>Why it changed</span><p>{adjustment?.why ?? briefing.dominantConstraint}</p></article>
        <article><span>Safe next</span><p>{adjustment?.safeNextAction ?? briefing.nextAction}</p></article>
        <article><span>If ignored</span><p>{adjustment?.consequence ?? briefing.consequence}</p></article>
      </div>
      <div className="coach-summary-card"><h3>Morning Readiness ↔ Next 72h</h3><p>Morning readiness is in <strong>{forwardStateLabel}</strong> mode. AERION carries that into the Next 72h plan as: {carriedSummary}.</p></div>
    </section>
  )
}
