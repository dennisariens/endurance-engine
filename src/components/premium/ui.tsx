import type { ComponentType, ReactNode } from 'react'
import type { DailyDecision } from '../../domain/types'
import type { Next72Plan } from '../../engine/recoveryPlanEngine'

export const formatLabel = (value: string) => value.replace(/([A-Z])/g, ' $1').trim()
export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
export const toneFromStatus = (decision: DailyDecision) => decision.status === 'Red' ? 'red' : decision.status === 'Yellow' ? 'yellow' : decision.status === 'InjuryIllness' ? 'purple' : 'green'
export const riskTone = (risk: string) => risk === 'Extreme' || risk === 'InjuryIllness' ? 'red' : risk === 'High' ? 'yellow' : 'green'

export function PremiumKpi({ label, value, detail, tone = 'slate', icon: Icon }: { label: string; value: string | number; detail: string; tone?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <article className={`premium-kpi tone-${tone}`}>
      <div className="premium-kpi-label">{Icon && <Icon size={15} strokeWidth={1.8} />}<span>{label}</span></div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

export function MetricTile({ label, value, detail, tone = 'slate', icon: Icon }: { label: string; value: string | number; detail: string; tone?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <article className={`aerion-metric-tile tone-${tone}`}>
      <div className="aerion-metric-label">{Icon && <Icon size={14} strokeWidth={1.8} />}<span>{label}</span></div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

export function CommandPanel({ eyebrow, title, summary, children, aside }: { eyebrow: string; title: string; summary: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="aerion-command-panel">
      <div className="aerion-command-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="aerion-command-summary">{summary}</p>
        {children}
      </div>
      {aside && <aside className="aerion-command-aside">{aside}</aside>}
    </div>
  )
}

export function RouteRail({ labels }: { labels?: string[] }) {
  return (
    <div className="aerion-route-rail" aria-hidden="true">
      <span />
      <i />
      <span />
      <i />
      <span />
      {labels?.length ? <div>{labels.map((label) => <small key={label}>{label}</small>)}</div> : null}
    </div>
  )
}

export function EvidenceStrip({ items }: { items: Array<{ label: string; value: string | number; detail: string; tone?: string }> }) {
  return (
    <div className="aerion-evidence-strip">
      {items.map((item) => <article key={item.label} className={`tone-${item.tone ?? 'slate'}`}>
        <span>{item.label}</span>
        <strong>{item.value}</strong>
        <p>{item.detail}</p>
      </article>)}
    </div>
  )
}

export function MiniTimeline({ plan }: { plan: Next72Plan }) {
  return (
    <div className="next72-strip">
      {plan.blocks.map((block) => (
        <article key={`${block.horizon}-${block.date}`} className={`next72-mini tone-${block.tone}`}>
          <span>{block.horizon}</span>
          <strong>{block.action}</strong>
          <p>{block.date}</p>
        </article>
      ))}
    </div>
  )
}
