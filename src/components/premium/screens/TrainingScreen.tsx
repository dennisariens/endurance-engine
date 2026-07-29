import { Activity, Gauge, Map, ShieldCheck } from 'lucide-react'
import { PremiumKpi, formatLabel } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function TrainingScreen({ recommendation, path, decision }: Props) {
  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header"><p className="eyebrow">Training</p><h2>Adaptive sessions, not calendar cosplay.</h2><p>Training exists only inside the available recovery budget. Actual completed work remains authoritative.</p></div>
      <div className="premium-training-grid paginated-grid">
        <PremiumKpi label="Primary session" value={recommendation.primary.title} detail={recommendation.primary.purpose} tone="blue" icon={Activity} />
        <PremiumKpi label="Duration / cap" value={`${recommendation.primary.durationMin || 'Off'} min`} detail={recommendation.primary.hrCap ? `HR ≤ ${recommendation.primary.hrCap}` : recommendation.primary.intensity} tone="green" icon={Gauge} />
        <PremiumKpi label="Current phase" value={path?.phase ?? formatLabel(decision.mode)} detail={path?.nextFocus?.[0] ?? recommendation.longTermBias} tone="slate" icon={Map} />
        <PremiumKpi label="Avoid" value={path?.avoid?.[0] ?? 'Unplanned intensity'} detail="If it damages tomorrow, it was not free today." tone="yellow" icon={ShieldCheck} />
      </div>
      <div className="coach-summary-card"><h3>Session steps</h3><ul>{recommendation.primary.steps.map((step) => <li key={step}>{step}</li>)}</ul></div>
    </section>
  )
}
