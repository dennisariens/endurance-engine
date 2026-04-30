type MetricCardProps = {
  label: string
  value: string
  detail: string
  tone?: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'slate'
}

export function MetricCard({ label, value, detail, tone = 'slate' }: MetricCardProps) {
  return (
    <article className={`card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
