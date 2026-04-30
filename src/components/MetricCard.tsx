import { InfoTooltip } from './InfoTooltip'

type MetricCardProps = {
  label: string
  value: string
  detail: string
  tone?: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'slate'
  tooltip?: string
}

export function MetricCard({ label, value, detail, tone = 'slate', tooltip }: MetricCardProps) {
  return (
    <article className={`card ${tone}`}>
      <span className="metric-label">{label}{tooltip && <InfoTooltip label={label} text={tooltip} />}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
